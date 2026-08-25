import { createClient, type Client } from "@libsql/client";
import fs from "fs";
import path from "path";

/**
 * 数据库连接：
 * - 本地/自建服务器：DATABASE_URL 缺省为 file:data/blog.db（SQLite 文件，与原来 JSON 一样本地存储）
 * - Vercel：设置 DATABASE_URL=libsql://... 与 TURSO_AUTH_TOKEN（Turso 托管 libSQL，SQLite 兼容）
 */
const DATABASE_URL = process.env.DATABASE_URL || "file:data/blog.db";
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

export const db: Client = createClient({
  url: DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN || undefined,
});

// 本地文件模式：确保 data 目录存在
if (DATABASE_URL.startsWith("file:")) {
  const file = DATABASE_URL.replace(/^file:/, "").split("?")[0];
  if (file) {
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  date TEXT NOT NULL,
  coverEmoji TEXT NOT NULL DEFAULT '📝',
  coverGradient TEXT NOT NULL DEFAULT '',
  coverImage TEXT,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

CREATE TABLE IF NOT EXISTS friends (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '',
  desc TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  postId TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(postId);

CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  value TEXT NOT NULL
);
`;

/** 首次初始化时，从仓库里的 data/*.json 导入种子数据（幂等：INSERT OR IGNORE） */
async function seedFromJson(): Promise<void> {
  const { DEFAULT_CONFIG } = await import("./config");

  // 配置：优先导入已有的 data/config.json（保留用户设置），否则用默认
  let configValue = JSON.stringify(DEFAULT_CONFIG);
  try {
    const saved = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data", "config.json"), "utf-8")
    ) as Record<string, unknown>;
    configValue = JSON.stringify({ ...DEFAULT_CONFIG, ...saved });
  } catch {
    /* data/config.json 不存在则用默认配置 */
  }
  await db.execute({
    sql: `INSERT OR IGNORE INTO config (id, value) VALUES (1, ?)`,
    args: [configValue],
  });

  // 文章种子
  try {
    const posts = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data", "posts.json"), "utf-8")
    ) as Array<Record<string, unknown>>;
    for (const p of posts) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO posts
          (id, slug, title, tags, date, coverEmoji, coverGradient, coverImage, excerpt, content)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          String(p.id),
          String(p.slug),
          String(p.title),
          JSON.stringify(p.tags ?? []),
          String(p.date),
          String(p.coverEmoji ?? "📝"),
          String(p.coverGradient ?? ""),
          p.coverImage ? String(p.coverImage) : null,
          String(p.excerpt ?? ""),
          String(p.content ?? ""),
        ],
      });
    }
  } catch {
    /* data/posts.json 不存在则跳过 */
  }

  // 友链种子
  try {
    const friends = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data", "friends.json"), "utf-8")
    ) as Array<Record<string, unknown>>;
    for (const f of friends) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO friends (id, name, url, avatar, desc, createdAt)
          VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          String(f.id),
          String(f.name),
          String(f.url),
          String(f.avatar ?? ""),
          String(f.desc ?? ""),
          String(f.createdAt ?? new Date().toISOString()),
        ],
      });
    }
  } catch {
    /* data/friends.json 不存在则跳过 */
  }
}

let initPromise: Promise<void> | null = null;

/**
 * 确保数据库已建表并完成种子导入（进程内只执行一次）。
 * 所有 store 操作前调用；本地与 Vercel 冷启动都会自动完成。
 */
export function ensureDb(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await db.executeMultiple(SCHEMA);
      const res = await db.execute(`SELECT COUNT(*) AS n FROM config`);
      const n = Number(res.rows[0]?.n ?? 0);
      if (n === 0) {
        await seedFromJson();
      }
    })();
  }
  return initPromise;
}
