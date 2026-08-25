import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

// 支持格式：jpg / png / webp（另兼容 jpeg、gif、svg）
const ALLOWED = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);

/**
 * 图片上传：保存到 data/uploads/，通过 /api/files/<name> 动态提供。
 * 无大小限制（用于封面、图片墙、背景、头像）。
 * 注意：不能放 public/ —— Next 生产构建只服务构建时已存在的 public 文件，
 * 运行期新增文件不会被提供（已知行为），因此用 API 路由实时读盘。
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
  const dir = path.join(process.cwd(), "data", "uploads");
  const buf = Buffer.from(await file.arrayBuffer());
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), buf);

  return NextResponse.json({ url: `/api/files/${name}` }, { status: 201 });
}
