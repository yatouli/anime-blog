import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";
import { deletePost, getPostById, updatePost } from "@/lib/store";
import type { PostInput } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const post = await getPostById(id);
  if (!post) return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PUT(req: Request, ctx: Ctx) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!verifyToken(token)) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Partial<PostInput>;
  if (!body.title?.trim() || !body.content?.trim()) {
    return NextResponse.json({ error: "标题和正文不能为空" }, { status: 400 });
  }
  const post = await updatePost(id, {
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
  if (!post) return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!verifyToken(token)) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const ok = await deletePost(id);
  if (!ok) return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
