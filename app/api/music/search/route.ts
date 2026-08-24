import { NextResponse } from "next/server";
import { searchSongs } from "@/lib/music";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keywords = searchParams.get("keywords")?.trim() || "";
  const limit = Math.min(30, Math.max(1, Number(searchParams.get("limit")) || 12));
  if (!keywords) {
    return NextResponse.json({ error: "缺少 keywords 参数" }, { status: 400 });
  }
  try {
    const songs = await searchSongs(keywords, limit);
    return NextResponse.json({ songs });
  } catch (e) {
    return NextResponse.json(
      { error: "音乐搜索服务暂时不可用", detail: String(e) },
      { status: 502 }
    );
  }
}
