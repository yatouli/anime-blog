import crypto from "crypto";
import { DEFAULT_CONFIG } from "./config";
import { db, ensureDb } from "./db";
import type {
  Comment,
  CommentInput,
  Friend,
  FriendInput,
  Post,
  PostInput,
  SiteConfig,
} from "./types";

export function uid(): string {
  return crypto.randomUUID();
}

function slugify(s: string): string {
  // 仅保留 ASCII 字母数字与连字符（中文标题自动回退为时间戳 slug，保证 URL 可靠）
  const base = s
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `post-${Date.now().toString(36)}`;
}

/* ---------------- 行 → 对象 ---------------- */

interface RawRow {
  id: string;
  slug: string;
  title: string;
  tags: string;
  date: string;
  coverEmoji: string;
  coverGradient: string;
  coverImage: string | null;
  excerpt: string;
  content: string;
}

function toPost(r: RawRow): Post {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    tags: safeJson<string[]>(r.tags, []),
    date: r.date,
    coverEmoji: r.coverEmoji,
    coverGradient: r.coverGradient,
    coverImage: r.coverImage || undefined,
    excerpt: r.excerpt,
    content: r.content,
  };
}

function safeJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

/* ---------------- Posts ---------------- */

export async function getPosts(): Promise<Post[]> {
  await ensureDb();
  const res = await db.execute(`SELECT * FROM posts ORDER BY date DESC`);
  return res.rows.map((r) => toPost(r as unknown as RawRow));
}

export async function getPostById(id: string): Promise<Post | undefined> {
  await ensureDb();
  const res = await db.execute({ sql: `SELECT * FROM posts WHERE id = ?`, args: [id] });
  return res.rows[0] ? toPost(res.rows[0] as unknown as RawRow) : undefined;
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  await ensureDb();
  const res = await db.execute({ sql: `SELECT * FROM posts WHERE slug = ?`, args: [slug] });
  return res.rows[0] ? toPost(res.rows[0] as unknown as RawRow) : undefined;
}

export async function createPost(input: PostInput): Promise<Post> {
  await ensureDb();
  const post: Post = {
    id: uid(),
    slug: await uniqueSlug(input.slug || slugify(input.title)),
    title: input.title,
    tags: input.tags ?? [],
    date: input.date || new Date().toISOString().slice(0, 10),
    coverEmoji: input.coverEmoji || "📝",
    coverGradient:
      input.coverGradient ||
      "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    coverImage: input.coverImage || undefined,
    excerpt:
      input.excerpt ||
      input.content.replace(/[#>*`_\-\[\]()!]/g, "").trim().slice(0, 120) ||
      "（暂无摘要）",
    content: input.content,
  };
  await db.execute({
    sql: `INSERT INTO posts
      (id, slug, title, tags, date, coverEmoji, coverGradient, coverImage, excerpt, content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      post.id,
      post.slug,
      post.title,
      JSON.stringify(post.tags),
      post.date,
      post.coverEmoji,
      post.coverGradient,
      post.coverImage ?? null,
      post.excerpt,
      post.content,
    ],
  });
  return post;
}

export async function updatePost(id: string, input: PostInput): Promise<Post | undefined> {
  await ensureDb();
  const prev = await getPostById(id);
  if (!prev) return undefined;

  const slug =
    input.slug && input.slug !== prev.slug ? await uniqueSlug(input.slug, id) : prev.slug;
  const tags = input.tags ?? prev.tags;
  const date = input.date || prev.date;
  const coverEmoji = input.coverEmoji || prev.coverEmoji;
  const coverGradient = input.coverGradient || prev.coverGradient;
  const coverImage =
    input.coverImage === undefined ? prev.coverImage : input.coverImage || undefined;
  const excerpt =
    input.excerpt ||
    input.content.replace(/[#>*`_\-\[\]()!]/g, "").trim().slice(0, 120) ||
    prev.excerpt;

  await db.execute({
    sql: `UPDATE posts SET slug=?, title=?, tags=?, date=?, coverEmoji=?, coverGradient=?, coverImage=?, excerpt=?, content=? WHERE id=?`,
    args: [
      slug,
      input.title,
      JSON.stringify(tags),
      date,
      coverEmoji,
      coverGradient,
      coverImage ?? null,
      excerpt,
      input.content,
      id,
    ],
  });
  return getPostById(id);
}

export async function deletePost(id: string): Promise<boolean> {
  await ensureDb();
  const res = await db.execute({ sql: `DELETE FROM posts WHERE id = ?`, args: [id] });
  return Number(res.rowsAffected) > 0;
}

async function uniqueSlug(slug: string, exceptId?: string): Promise<string> {
  let s = slug;
  let i = 2;
  for (;;) {
    const res = await db.execute({
      sql: exceptId
        ? `SELECT 1 FROM posts WHERE slug = ? AND id != ?`
        : `SELECT 1 FROM posts WHERE slug = ?`,
      args: exceptId ? [s, exceptId] : [s],
    });
    if (res.rows.length === 0) return s;
    s = `${slug}-${i++}`;
  }
}

/* ---------------- Friends ---------------- */

export async function getFriends(): Promise<Friend[]> {
  await ensureDb();
  const res = await db.execute(`SELECT * FROM friends ORDER BY createdAt DESC`);
  return res.rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    url: String(r.url),
    avatar: String(r.avatar ?? ""),
    desc: String(r.desc ?? ""),
    createdAt: String(r.createdAt),
  }));
}

export async function addFriend(input: FriendInput): Promise<Friend> {
  await ensureDb();
  const friend: Friend = {
    id: uid(),
    name: input.name.trim().slice(0, 30),
    url: input.url.trim().slice(0, 300),
    avatar:
      input.avatar?.trim().slice(0, 500) ||
      `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(
        input.name.trim()
      )}`,
    desc: input.desc?.trim().slice(0, 100) || "这位朋友很低调，什么也没写～",
    createdAt: new Date().toISOString(),
  };
  await db.execute({
    sql: `INSERT INTO friends (id, name, url, avatar, desc, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [friend.id, friend.name, friend.url, friend.avatar, friend.desc, friend.createdAt],
  });
  return friend;
}

/* ---------------- Comments ---------------- */

export async function getCommentsByPost(postId: string): Promise<Comment[]> {
  await ensureDb();
  const res = await db.execute({
    sql: `SELECT * FROM comments WHERE postId = ? ORDER BY createdAt ASC`,
    args: [postId],
  });
  return res.rows.map((r) => ({
    id: String(r.id),
    postId: String(r.postId),
    name: String(r.name),
    content: String(r.content),
    createdAt: String(r.createdAt),
  }));
}

export async function addComment(input: CommentInput): Promise<Comment> {
  await ensureDb();
  const comment: Comment = {
    id: uid(),
    postId: input.postId,
    name: input.name.trim().slice(0, 30),
    content: input.content.trim().slice(0, 1000),
    createdAt: new Date().toISOString(),
  };
  await db.execute({
    sql: `INSERT INTO comments (id, postId, name, content, createdAt) VALUES (?, ?, ?, ?, ?)`,
    args: [comment.id, comment.postId, comment.name, comment.content, comment.createdAt],
  });
  return comment;
}

/* ---------------- Site Config ---------------- */

export async function getConfig(): Promise<SiteConfig> {
  await ensureDb();
  const res = await db.execute(`SELECT value FROM config WHERE id = 1`);
  const saved = res.rows[0] ? safeJson<Partial<SiteConfig>>(String(res.rows[0].value), {}) : {};
  return { ...DEFAULT_CONFIG, ...saved };
}

export async function saveConfig(input: Partial<SiteConfig>): Promise<SiteConfig> {
  await ensureDb();
  // 只合并显式传入的字段：跳过 undefined，避免部分更新把其他配置清空
  const merged = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined)
  ) as Partial<SiteConfig>;
  const next: SiteConfig = {
    ...(await getConfig()),
    ...merged,
  };
  // 仅对显式传入的字段做校验/钳制
  if (merged.backgroundType !== undefined) {
    next.backgroundType = merged.backgroundType === "image" ? "image" : "gradient";
  }
  if (merged.blur !== undefined) {
    next.blur = Math.max(0, Math.min(40, Number(merged.blur) || 0));
  }
  if (merged.overlay !== undefined) {
    next.overlay = Math.max(0, Math.min(0.8, Number(merged.overlay) || 0));
  }
  if (merged.avatar !== undefined) {
    next.avatar = merged.avatar.trim().slice(0, 500);
  }
  if (merged.gallery !== undefined) {
    const list = Array.isArray(merged.gallery) ? merged.gallery : [];
    next.gallery = list
      .filter((it) => it && typeof it.src === "string" && it.src.trim())
      .slice(0, 100)
      .map((it) => ({
        src: it.src.trim().slice(0, 500),
        title: (it.title || "").toString().trim().slice(0, 50) || "未命名",
        w: Math.max(1, Math.min(8, Number(it.w) || 3)),
        h: Math.max(1, Math.min(8, Number(it.h) || 4)),
      }));
  }
  await db.execute({
    sql: `INSERT INTO config (id, value) VALUES (1, ?)
          ON CONFLICT(id) DO UPDATE SET value = excluded.value`,
    args: [JSON.stringify(next)],
  });
  return next;
}
