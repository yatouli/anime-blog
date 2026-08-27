import { NextResponse } from "next/server";
import { lyric } from "@/lib/music";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim() || "";
  const artist = searchParams.get("artist")?.trim() || "";
  if (!name) {
    return NextResponse.json({ error: "缺少 name 参数" }, { status: 400 });
  }
  try {
    const lines = await lyric(name, artist);
    return NextResponse.json({ lines });
  } catch (e) {
    return NextResponse.json(
      { error: "获取歌词失败", detail: String(e) },
      { status: 502 }
    );
  }
}
