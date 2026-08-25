import fs from "fs";
import path from "path";
import crypto from "crypto";
import { DEFAULT_CONFIG } from "./config";
import type {
  Comment,
  CommentInput,
  Friend,
  FriendInput,
  Post,
  PostInput,
  SiteConfig,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const POSTS_FILE = path.join(DATA_DIR, "posts.json");
const FRIENDS_FILE = path.join(DATA_DIR, "friends.json");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

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

/* ---------------- Posts ---------------- */

export function getPosts(): Post[] {
  return readJson<Post[]>(POSTS_FILE, []).sort((a, b) =>
    b.date.localeCompare(a.date)
  );
}

export function getPostById(id: string): Post | undefined {
  return getPosts().find((p) => p.id === id);
}

export function getPostBySlug(slug: string): Post | undefined {
  return getPosts().find((p) => p.slug === slug);
}

export function createPost(input: PostInput): Post {
  const posts = readJson<Post[]>(POSTS_FILE, []);
  const slug = uniqueSlug(input.slug || slugify(input.title), posts);
  const post: Post = {
    id: uid(),
    slug,
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
  posts.push(post);
  writeJson(POSTS_FILE, posts);
  return post;
}

export function updatePost(id: string, input: PostInput): Post | undefined {
  const posts = readJson<Post[]>(POSTS_FILE, []);
  const idx = posts.findIndex((p) => p.id === id);
  if (idx < 0) return undefined;
  const prev = posts[idx];
  const slug =
    input.slug && input.slug !== prev.slug
      ? uniqueSlug(input.slug, posts.filter((_, i) => i !== idx))
      : prev.slug;
  posts[idx] = {
    ...prev,
    ...input,
    id,
    slug,
    tags: input.tags ?? prev.tags,
    date: input.date || prev.date,
    coverEmoji: input.coverEmoji || prev.coverEmoji,
    coverGradient: input.coverGradient || prev.coverGradient,
    coverImage: input.coverImage === undefined ? prev.coverImage : input.coverImage || undefined,
    excerpt:
      input.excerpt ||
      input.content.replace(/[#>*`_\-\[\]()!]/g, "").trim().slice(0, 120) ||
      prev.excerpt,
  };
  writeJson(POSTS_FILE, posts);
  return posts[idx];
}

export function deletePost(id: string): boolean {
  const posts = readJson<Post[]>(POSTS_FILE, []);
  const next = posts.filter((p) => p.id !== id);
  if (next.length === posts.length) return false;
  writeJson(POSTS_FILE, next);
  return true;
}

function uniqueSlug(slug: string, posts: Post[]): string {
  let s = slug;
  let i = 2;
  while (posts.some((p) => p.slug === s)) {
    s = `${slug}-${i++}`;
  }
  return s;
}

/* ---------------- Friends ---------------- */

export function getFriends(): Friend[] {
  return readJson<Friend[]>(FRIENDS_FILE, []).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function addFriend(input: FriendInput): Friend {
  const friends = readJson<Friend[]>(FRIENDS_FILE, []);
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
  friends.push(friend);
  writeJson(FRIENDS_FILE, friends);
  return friend;
}

/* ---------------- Comments ---------------- */

export function getCommentsByPost(postId: string): Comment[] {
  return readJson<Comment[]>(COMMENTS_FILE, [])
    .filter((c) => c.postId === postId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function addComment(input: CommentInput): Comment {
  const comments = readJson<Comment[]>(COMMENTS_FILE, []);
  const comment: Comment = {
    id: uid(),
    postId: input.postId,
    name: input.name.trim().slice(0, 30),
    content: input.content.trim().slice(0, 1000),
    createdAt: new Date().toISOString(),
  };
  comments.push(comment);
  writeJson(COMMENTS_FILE, comments);
  return comment;
}

/* ---------------- Site Config ---------------- */

export function getConfig(): SiteConfig {
  const saved = readJson<Partial<SiteConfig>>(CONFIG_FILE, {});
  return { ...DEFAULT_CONFIG, ...saved };
}

export function saveConfig(input: Partial<SiteConfig>): SiteConfig {
  // 只合并显式传入的字段：跳过 undefined，避免部分更新把其他配置清空
  const merged = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined)
  ) as Partial<SiteConfig>;
  const next: SiteConfig = {
    ...getConfig(),
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
  writeJson(CONFIG_FILE, next);
  return next;
}
