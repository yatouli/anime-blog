import { NextResponse } from "next/server";

/** Blob store 公开域名（与 /api/upload 的存储对应） */
const BLOB_PUBLIC_HOST = "1lznjn0gjydymwhv.public.blob.vercel-storage.com";

/**
 * 图片代理：经本站转发 Blob 图片。
 * 上传时返回 /api/blob/<name>，图片走 CF 代理 → Vercel → Blob，
 * 解决 blob.vercel-storage.com 直连域名在国内加载不稳定的问题。
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ name: string }> }
) {
  const { name } = await ctx.params;
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return NextResponse.json({ error: "非法文件名" }, { status: 400 });
  }
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
