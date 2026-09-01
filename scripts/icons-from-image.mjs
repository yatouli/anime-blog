#!/usr/bin/env node
/**
 * 从一张图片生成站点图标（favicon / PWA / 分享图）：
 *   node scripts/icons-from-image.mjs [输入图] [输出目录]
 * 默认输入 public/icons/atori2.png，输出 public/icons/icon-192.png + icon-512.png。
 * 依赖 sharp（已在项目依赖中）。
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const input = process.argv[2] || path.join(process.cwd(), "public", "icons", "atori2.png");
const outDir = process.argv[3] || path.join(process.cwd(), "public", "icons");

if (!fs.existsSync(input)) {
  console.error(`找不到输入图片：${input}`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const base = sharp(input);

// 保持透明、居中缩放为正方形
async function make(size) {
  const out = path.join(outDir, `icon-${size}.png`);
  await base
    .clone()
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out);
  console.log(`generated ${path.relative(process.cwd(), out)} (${size}x${size})`);
}

await make(192);
await make(512);
console.log("done");
