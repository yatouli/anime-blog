import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";
import { createPost, getPosts } from "@/lib/store";
import type { PostInput } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ posts: await getPosts() });
}

export async function POST(req: Request) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!verifyToken(token)) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Partial<PostInput>;
  if (!body.title?.trim() || !body.content?.trim()) {
    return NextResponse.json({ error: "标题和正文不能为空" }, { status: 400 });
  }
  const post = await createPost({
    title: body.title,
    content: body.content,
    slug: body.slug,
    tags: body.tags,
    date: body.date,
    coverEmoji: body.coverEmoji,
    coverGradient: body.coverGradient,
    coverImage: body.coverImage,
    excerpt: body.excerpt,
  });
  return NextResponse.json({ post }, { status: 201 });
}
