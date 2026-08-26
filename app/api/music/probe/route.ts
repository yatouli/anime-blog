import { NextResponse } from "next/server";

/** 临时调试路由：从 Vercel 节点探测外部 API 可达性（测试后删除） */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const u = searchParams.get("u") || "";
  if (!/^https:\/\//.test(u)) {
    return NextResponse.json({ error: "只允许 https" }, { status: 400 });
  }
  try {
    const res = await fetch(u, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://music.163.com",
      },
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    return NextResponse.json({
      status: res.status,
      len: text.length,
      head: text.slice(0, 600),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
