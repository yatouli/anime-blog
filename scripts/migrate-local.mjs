#!/usr/bin/env node
/**
 * 一键迁移：Vercel(Turso + Blob) → 国内自建服务器（本地 SQLite + data/uploads/）
 *
 * 用法 A（直连 Turso，在项目根目录执行，需 Node >= 22.5）：
 *   DATABASE_URL=libsql://xxx.turso.io TURSO_AUTH_TOKEN=yyy node scripts/migrate-local.mjs
 *
 * 用法 B（从 JSON 导出文件读数据，无需 Turso 凭据）：
 *   DATA_JSON=export.json node scripts/migrate-local.mjs
 *   export.json 结构：{ "posts": [...], "friends": [...], "comments": [...], "config": [...] }
 *   （行对象字段与表列一致，可直接来自 Turso 的 SELECT * 导出）
 *
 * 可选环境变量：
 *   BLOB_HTTP      图片下载源，默认 https://1lznjn0gjydymwhv.public.blob.vercel-storage.com
 *   OUT_DB         本地数据库路径，默认 data/blog.db
 *   OUT_DIR        本地图片目录，默认 data/uploads
 *   SKIP_IMAGES=1  只迁移数据库，跳过图片下载
 *
 * 脚本做的事：
 *   1. 读出 posts / friends / comments / config 全部数据（Turso 或 JSON 导出）
 *   2. 写入本地 SQLite（与 lib/db.ts 相同的表结构）
 *   3. 扫描所有数据里的图片引用（/api/blob/xxx 或 blob.vercel-storage.com/uploads/xxx）
 *      逐个下载到 data/uploads/（已存在则跳过）
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DB_URL = process.env.DATABASE_URL;
const DB_TOKEN = process.env.TURSO_AUTH_TOKEN;
const DATA_JSON = process.env.DATA_JSON;
const BLOB_HTTP = (
  process.env.BLOB_HTTP || "https://1lznjn0gjydymwhv.public.blob.vercel-storage.com"
).replace(/\/$/, "");
const OUT_DB = process.env.OUT_DB || "data/blog.db";
const OUT_DIR = process.env.OUT_DIR || "data/uploads";
const SKIP_IMAGES = process.env.SKIP_IMAGES === "1";

if (!DATA_JSON && (!DB_URL || !DB_TOKEN)) {
  console.error(
    "缺少数据来源：设置 DATA_JSON=<导出文件>（用法 B），\n" +
      "或设置 DATABASE_URL + TURSO_AUTH_TOKEN（用法 A，在 Vercel 项目设置可查）"
  );
  process.exit(1);
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
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(postId);
CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  value TEXT NOT NULL
);
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("== 1/3 读取数据 ==");
  const tables = ["posts", "friends", "comments", "config"];
  const data = {};
  if (DATA_JSON) {
    const file = path.resolve(root, DATA_JSON);
    // 兼容 Windows 导出的 UTF-8 BOM
    const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
    const j = JSON.parse(raw);
    for (const t of tables) data[t] = Array.isArray(j[t]) ? j[t] : [];
    console.log(`  来自 JSON 导出：${file}`);
  } else {
    console.log("  来自 Turso");
    const { createClient } = await import("@libsql/client/web");
    const turso = createClient({
      url: DB_URL.replace(/^libsql:\/\//, "https://"),
      authToken: DB_TOKEN,
    });
    for (const t of tables) {
      const res = await turso.execute(`SELECT * FROM ${t}`);
      data[t] = res.rows.map((r) => ({ ...r }));
    }
    turso.close?.();
  }
  for (const t of tables) console.log(`  ${t}: ${data[t].length} 行`);

  console.log("== 2/3 写入本地 SQLite ==");
  fs.mkdirSync(path.dirname(path.resolve(root, OUT_DB)), { recursive: true });
  const sqlite = new DatabaseSync(path.resolve(root, OUT_DB));
  sqlite.exec(SCHEMA);

  for (const row of data.posts) {
    sqlite
      .prepare(
        `INSERT OR REPLACE INTO posts
         (id, slug, title, tags, date, coverEmoji, coverGradient, coverImage, excerpt, content, views)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        String(row.id ?? ""),
        String(row.slug ?? ""),
        String(row.title ?? ""),
        String(row.tags ?? "[]"),
        String(row.date ?? ""),
        String(row.coverEmoji ?? "📝"),
        String(row.coverGradient ?? ""),
        row.coverImage != null ? String(row.coverImage) : null,
        String(row.excerpt ?? ""),
        String(row.content ?? ""),
        Number(row.views ?? 0)
      );
  }
  for (const row of data.friends) {
    sqlite
      .prepare(
        `INSERT OR REPLACE INTO friends (id, name, url, avatar, desc, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        String(row.id ?? ""),
        String(row.name ?? ""),
        String(row.url ?? ""),
        String(row.avatar ?? ""),
        String(row.desc ?? ""),
        String(row.createdAt ?? new Date().toISOString())
      );
  }
  for (const row of data.comments) {
    sqlite
      .prepare(
        `INSERT OR REPLACE INTO comments (id, postId, name, content, createdAt)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        String(row.id ?? ""),
        String(row.postId ?? ""),
        String(row.name ?? ""),
        String(row.content ?? ""),
        String(row.createdAt ?? new Date().toISOString())
      );
  }
  for (const row of data.config) {
    sqlite
      .prepare(`INSERT OR REPLACE INTO config (id, value) VALUES (?, ?)`)
      .run(Number(row.id ?? 1), String(row.value ?? "{}"));
  }
  sqlite.close();
  console.log(`  已写入 ${path.resolve(root, OUT_DB)}`);

  if (SKIP_IMAGES) {
    console.log("== 3/3 跳过图片下载（SKIP_IMAGES=1）==");
    return;
  }

  console.log("== 3/3 扫描并下载图片 ==");
  const names = new Set();
  const blobRe = /(?:api\/blob\/|blob\.vercel-storage\.com\/uploads\/)([a-zA-Z0-9._-]+)/g;
  for (const rows of Object.values(data)) {
    for (const row of rows) {
      const text = JSON.stringify(row);
      for (const m of text.matchAll(blobRe)) names.add(m[1]);
    }
  }
  console.log(`  引用图片 ${names.size} 个`);
  fs.mkdirSync(path.resolve(root, OUT_DIR), { recursive: true });

  let ok = 0;
  let skip = 0;
  let fail = 0;
  for (const name of names) {
    const dest = path.join(path.resolve(root, OUT_DIR), name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      skip++;
      continue;
    }
    try {
      const res = await fetch(`${BLOB_HTTP}/uploads/${name}`, {
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buf);
      ok++;
      console.log(`  ↓ ${name} (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (e) {
      fail++;
      console.error(`  ✗ ${name}: ${e.message}`);
    }
    await sleep(100); // 轻微限速，避免触发风控
  }
  console.log(`  图片完成：下载 ${ok}，跳过 ${skip}，失败 ${fail}`);
  console.log("\n迁移完成！把 data/blog.db 与 data/uploads/ 一起放到服务器即可。");
}

main().catch((e) => {
  console.error("迁移失败:", e);
  process.exit(1);
});
