import { NextResponse } from "next/server";
import { songUrl } from "@/lib/music";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "缺少 id 参数" }, { status: 400 });
  }
  try {
    const url = await songUrl(id);
    if (!url) {
      return NextResponse.json(
        { error: "该歌曲暂无可播放音频（可能受版权限制）" },
        { status: 404 }
      );
    }
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json(
      { error: "获取音频地址失败", detail: String(e) },
      { status: 502 }
    );
  }
}
