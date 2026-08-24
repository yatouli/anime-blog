import { NextResponse } from "next/server";
import { songDetail } from "@/lib/music";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ids = (searchParams.get("ids") || "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => n > 0);
  if (!ids.length) {
    return NextResponse.json({ error: "缺少 ids 参数" }, { status: 400 });
  }
  try {
    const songs = await songDetail(ids);
    return NextResponse.json({ songs });
  } catch (e) {
    return NextResponse.json(
      { error: "获取歌曲详情失败", detail: String(e) },
      { status: 502 }
    );
  }
}
