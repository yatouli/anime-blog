import { DatabaseSync } from "node:sqlite";
import { createClient as createWebClient } from "@libsql/client/web";
import fs from "fs";
import path from "path";

/**
 * 数据库连接：
 * - 本地/自建服务器：DATABASE_URL 缺省为 file:data/blog.db，用 Node 内置 SQLite（node:sqlite，零依赖）
 * - Cloudflare Workers / serverless：DATABASE_URL=libsql://... + TURSO_AUTH_TOKEN（Turso）
 *   远程用 @libsql/client/web（纯 HTTP，Workers 兼容）
 */

interface Row {
  [key: string]: unknown;
}

interface ExecResult {
  rows: Row[];
  rowsAffected?: number;
}

export interface DbLike {
  execute(q: string | { sql: string; args?: unknown[] }): Promise<ExecResult>;
  executeMultiple(sql: string): Promise<void>;
}

const DATABASE_URL = process.env.DATABASE_URL || "file:data/blog.db";
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;
const isLocalFile = DATABASE_URL.startsWith("file:");

/** 本地 SQLite 适配器（node:sqlite），提供与 libsql client 兼容的 execute 接口 */
function createLocalDb(filePath: string): DbLike {
  // 确保 data 目录存在
  fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
  const sqlite = new DatabaseSync(filePath);

  return {
    async execute(q) {
      if (typeof q === "string") {
        const stmt = sqlite.prepare(q);
        return { rows: stmt.all() as unknown as Row[] };
      }
      const stmt = sqlite.prepare(q.sql);
      const args = (q.args ?? []) as never[];
      const upper = q.sql.trimStart().toUpperCase();
      if (upper.startsWith("SELECT") || upper.startsWith("PRAGMA") || upper.startsWith("WITH")) {
        return { rows: stmt.all(...args) as unknown as Row[] };
      }
      const res = stmt.run(...args);
      return { rows: [], rowsAffected: Number(res.changes ?? 0) };
    },
    async executeMultiple(sql) {
      sqlite.exec(sql);
    },
  };
}

/**
 * 数据库客户端：本地 file: 用内置 SQLite；远程 libsql:// 用 @libsql/client/web
 * （转成 https://，web 客户端走 HTTP，Workers 兼容；条件分支避免创建不支持的客户端）
 */
export const db: DbLike = isLocalFile
  ? createLocalDb(DATABASE_URL.replace(/^file:/, "").split("?")[0])
  : (createWebClient({
      url: DATABASE_URL.replace(/^libsql:\/\//, "https://"),
      authToken: TURSO_AUTH_TOKEN || undefined,
    }) as unknown as DbLike);

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
  content TEXT NOT NULL DEFAULT '',
  views INTEGER NOT NULL DEFAULT 0
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
  createdAt TEXT NOT NULL,
  parentId TEXT,
  replyTo TEXT
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
          (id, slug, title, tags, date, coverEmoji, coverGradient, coverImage, excerpt, content, views)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
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

/** 轻量迁移：给旧库补充缺失的列（不重建表） */
async function migrate(): Promise<void> {
  const info = await db.execute(`PRAGMA table_info(posts)`);
  const cols = info.rows.map((r) => String(r.name));
  if (!cols.includes("views")) {
    await db.execute(`ALTER TABLE posts ADD COLUMN views INTEGER NOT NULL DEFAULT 0`);
  }

  // 评论回复功能：parentId / replyTo 列
  const cinfo = await db.execute(`PRAGMA table_info(comments)`);
  const ccols = cinfo.rows.map((r) => String(r.name));
  if (!ccols.includes("parentId")) {
    await db.execute(`ALTER TABLE comments ADD COLUMN parentId TEXT`);
  }
  if (!ccols.includes("replyTo")) {
    await db.execute(`ALTER TABLE comments ADD COLUMN replyTo TEXT`);
  }
}

/**
 * 确保数据库已建表并完成种子导入（进程内只执行一次）。
 * 所有 store 操作前调用；本地与 serverless 冷启动都会自动完成。
 */
export function ensureDb(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await db.executeMultiple(SCHEMA);
      await migrate();
      const res = await db.execute(`SELECT COUNT(*) AS n FROM config`);
      const n = Number(res.rows[0]?.n ?? 0);
      if (n === 0) {
        await seedFromJson();
      }
    })();
  }
  return initPromise;
}
