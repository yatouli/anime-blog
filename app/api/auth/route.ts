import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, makeToken, verifyToken } from "@/lib/auth";
import { site } from "@/lib/site";

export async function GET() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  return NextResponse.json({ ok: verifyToken(token) });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = String(body?.password ?? "");
  const expect = process.env.ADMIN_PASSWORD || site.adminPassword;
  if (password !== expect) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, makeToken(expect), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
