import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

/** 动态提供本地上传的图片（data/uploads/），实时读盘 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ name: string }> }
) {
  const { name } = await ctx.params;
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return NextResponse.json({ error: "非法文件名" }, { status: 400 });
  }
  const file = path.join(process.cwd(), "data", "uploads", name);
  if (!fs.existsSync(file)) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
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
