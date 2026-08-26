import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";
import { getConfig, saveConfig } from "@/lib/store";
import type { SiteConfig } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ config: await getConfig() });
}

export async function PUT(req: Request) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!verifyToken(token)) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Partial<SiteConfig>;
  const config = await saveConfig({
    backgroundType: body.backgroundType,
    gradient: typeof body.gradient === "string" ? body.gradient : undefined,
    image: typeof body.image === "string" ? body.image : undefined,
    blur: typeof body.blur === "number" ? body.blur : undefined,
    overlay: typeof body.overlay === "number" ? body.overlay : undefined,
    avatar: typeof body.avatar === "string" ? body.avatar : undefined,
    gallery: Array.isArray(body.gallery) ? body.gallery : undefined,
    albums: Array.isArray(body.albums) ? body.albums : undefined,
  });
  return NextResponse.json({ config });
}
