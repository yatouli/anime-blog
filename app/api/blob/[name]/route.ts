import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

/** Blob store 公开域名（与 /api/upload 的 Blob 模式对应） */
const BLOB_PUBLIC_HOST = "1lznjn0gjydymwhv.public.blob.vercel-storage.com";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

/**
 * 图片代理：
 * - Blob 模式（设置了 BLOB_READ_WRITE_TOKEN，如 Vercel）：经本站转发 Blob 图片，
 *   解决 blob.vercel-storage.com 直连域名在国内加载不稳定的问题。
 * - 本地模式（自建服务器/国内部署）：直接从 data/uploads/ 读盘，
 *   迁移到本地后 /api/blob/<name> 路径无需改动即可继续工作。
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ name: string }> }
) {
  const { name } = await ctx.params;
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return NextResponse.json({ error: "非法文件名" }, { status: 400 });
  }

  // —— 本地模式：直接读 data/uploads/ ——
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const file = path.join(process.cwd(), "data", "uploads", name);
    if (!fs.existsSync(file)) {
      return NextResponse.json({ error: "图片不存在" }, { status: 404 });
    }
    const ext = name.split(".").pop()?.toLowerCase() || "";
    const buf = fs.readFileSync(file);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  // —— Blob 模式：转发 Vercel Blob ——
  try {
    const url = `https://${BLOB_PUBLIC_HOST}/uploads/${name}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
    if (!res.ok) {
      return NextResponse.json({ error: "图片不存在" }, { status: 404 });
    }
    return new Response(res.body, {
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "图片加载失败" }, { status: 502 });
  }
}
