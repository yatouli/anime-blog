import crypto from "crypto";
import { site } from "./site";

const COOKIE_NAME = "blog_admin";
const SECRET = "anime-blog::" + (process.env.ADMIN_PASSWORD || site.adminPassword);

export function makeToken(password: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(password + "::" + new Date().toISOString().slice(0, 10))
    .digest("hex");
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const expect = makeToken(process.env.ADMIN_PASSWORD || site.adminPassword);
  // 恒定时间比较
  const a = Buffer.from(token);
  const b = Buffer.from(expect);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export const AUTH_COOKIE = COOKIE_NAME;
