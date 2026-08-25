import { NextResponse } from "next/server";
import { getPostById, incrementViews } from "@/lib/store";

/** 阅读量 +1（文章详情页由客户端在挂载后调用，避免 SSR/爬虫重复计数） */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const post = await getPostById(id);
  if (!post) return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  await incrementViews(id);
  return NextResponse.json({ views: post.views + 1 });
}
