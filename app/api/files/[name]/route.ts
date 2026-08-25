import { NextResponse } from "next/server";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

/** 动态提供上传的图片：Cloudflare Workers 从 R2 读，本地从 data/uploads/ 读 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ name: string }> }
) {
  const { name } = await ctx.params;
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return NextResponse.json({ error: "非法文件名" }, { status: 400 });
  }
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const contentType = MIME[ext] || "application/octet-stream";

  // —— Cloudflare R2 模式 ——
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    const bucket = env?.BLOG_UPLOADS;
    if (bucket?.get) {
      const obj = await bucket.get(name);
      if (!obj) {
        return NextResponse.json({ error: "文件不存在" }, { status: 404 });
      }
      return new Response(obj.body, {
        headers: {
          "Content-Type": obj.httpMetadata?.contentType || contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch {
    /* 非 CF 环境，走本地 */
  }

  // —— 本地文件模式 ——
  const fs = await import("fs");
  const path = await import("path");
  const file = path.join(process.cwd(), "data", "uploads", name);
  if (!fs.existsSync(file)) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }
  const buf = fs.readFileSync(file);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
