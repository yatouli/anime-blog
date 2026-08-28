import { NextResponse } from "next/server";
import { addComment, getCommentsByPost } from "@/lib/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId") || "";
  if (!postId) {
    return NextResponse.json({ error: "缺少 postId 参数" }, { status: 400 });
  }
  return NextResponse.json({ comments: await getCommentsByPost(postId) });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    postId?: string;
    name?: string;
    content?: string;
    parentId?: string;
    replyTo?: string;
  };
  const name = body.name?.trim() || "";
  const content = body.content?.trim() || "";
  if (!body.postId) {
    return NextResponse.json({ error: "缺少 postId" }, { status: 400 });
  }
  if (!name || !content) {
    return NextResponse.json({ error: "昵称和评论内容不能为空" }, { status: 400 });
  }
  if (name.length > 30 || content.length > 1000) {
    return NextResponse.json({ error: "昵称最长 30 字，评论最长 1000 字" }, { status: 400 });
  }
  const comment = await addComment({
    postId: body.postId,
    name,
    content,
    parentId: body.parentId || undefined,
    replyTo: body.replyTo || undefined,
  });
  return NextResponse.json({ comment }, { status: 201 });
}
