// 下载 Shizuku Live2D 模型到 public/live2d/shizuku/
import fs from "fs";
import path from "path";

const API_BASE = "https://api.github.com/repos/guansss/pixi-live2d-display/contents/test/assets/shizuku";
const RAW_BASE = "https://raw.githubusercontent.com/guansss/pixi-live2d-display/master/test/assets/shizuku";
const OUT = path.join(process.cwd(), "public", "live2d", "shizuku");
// 跳过声音目录
const SKIP = new Set(["sounds"]);

async function fetchJson(url) {
  for (let i = 1; i <= 4; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "anime-blog" }, signal: AbortSignal.timeout(25000) });
      if (r.ok) return await r.json();
      console.log("API 非 200:", r.status, url);
    } catch (e) {
      console.log(`API 尝试${i}失败:`, e.cause?.code || e.message, url);
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  return null;
}

async function downloadFile(relPath) {
  const dest = path.join(OUT, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    console.log("跳过(已存在):", relPath);
    return;
  }
  const url = `${RAW_BASE}/${relPath}`;
  for (let i = 1; i <= 4; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(40000) });
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        fs.writeFileSync(dest, buf);
        console.log(`下载 ${relPath} (${(buf.length / 1024).toFixed(0)}KB)`);
        return;
      }
      console.log("raw 非 200:", r.status, url);
    } catch (e) {
      console.log(`下载尝试${i}失败:`, e.cause?.code || e.message, relPath);
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  console.log("❌ 下载失败:", relPath);
}

async function walk(apiPath, relDir = "") {
  const items = await fetchJson(`${API_BASE}${apiPath}`);
  if (!Array.isArray(items)) return;
  for (const item of items) {
    if (SKIP.has(item.name)) continue;
    const rel = relDir ? `${relDir}/${item.name}` : item.name;
    if (item.type === "dir") {
      await walk(`/${item.name}`, rel);
    } else {
      await downloadFile(rel);
    }
  }
}

console.log("开始下载 Shizuku 模型 →", OUT);
await walk("");
console.log("完成 ✅");
