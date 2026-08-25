import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

// 支持格式：jpg / png / webp（另兼容 jpeg、gif、svg）
const ALLOWED = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);

/** 尝试从 Cloudflare R2 获取 bucket（非 CF 环境返回 null） */
async function getR2Bucket(): Promise<{ put: (k: string, v: ArrayBuffer, m?: object) => Promise<unknown> } | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    if (env?.BLOG_UPLOADS?.put) return env.BLOG_UPLOADS;
    return null;
  } catch {
    return null;
  }
}

/**
 * 图片上传（封面 / 图片墙 / 背景 / 头像），无大小限制。
 * - Cloudflare Workers：写入 R2（BLOG_UPLOADS bucket），经 /api/files/<name> 读取
 * - 本地/自建服务器：保存到 data/uploads/，经 /api/files/<name> 动态提供
 */
export async function POST(req: Request) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!verifyToken(token)) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || !file.name) {
    return NextResponse.json({ error: "未收到文件" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED.has(ext)) {
    return NextResponse.json({ error: "仅支持图片：jpg/png/webp（含 gif/svg）" }, { status: 400 });
  }

  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // —— Cloudflare R2 模式（Workers 部署）——
  const r2 = await getR2Bucket();
  if (r2) {
    await r2.put(name, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });
    return NextResponse.json({ url: `/api/files/${name}` }, { status: 201 });
  }

  // —— 本地文件模式 ——
  const dir = path.join(process.cwd(), "data", "uploads");
  const buf = Buffer.from(await file.arrayBuffer());
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), buf);

  return NextResponse.json({ url: `/api/files/${name}` }, { status: 201 });
}
