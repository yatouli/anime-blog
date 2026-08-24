import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";
import { getConfig, saveConfig } from "@/lib/store";
import type { SiteConfig } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ config: getConfig() });
}

export async function PUT(req: Request) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!verifyToken(token)) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Partial<SiteConfig>;
  const config = saveConfig({
    backgroundType: body.backgroundType,
    gradient: typeof body.gradient === "string" ? body.gradient : undefined,
    image: typeof body.image === "string" ? body.image : undefined,
    blur: typeof body.blur === "number" ? body.blur : undefined,
    overlay: typeof body.overlay === "number" ? body.overlay : undefined,
  });
  return NextResponse.json({ config });
}
