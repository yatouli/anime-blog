import { NextResponse } from "next/server";

/** 临时调试路由：从 Vercel 节点探测外部 API 可达性（测试后删除） */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const u = searchParams.get("u") || "";
  const method = searchParams.get("m") || "GET";
  const params = searchParams.get("params") || "";
  const encSecKey = searchParams.get("encSecKey") || "";
  if (!/^https:\/\//.test(u)) {
    return NextResponse.json({ error: "只允许 https" }, { status: 400 });
  }
  try {
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      Referer: "https://music.163.com/",
      Cookie: "os=pc; appver=8.9.70",
    };
    let body: string | undefined;
    if (method === "POST") {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      body = `params=${encodeURIComponent(params)}&encSecKey=${encodeURIComponent(encSecKey)}`;
    }
    const res = await fetch(u, {
      method,
      headers,
      body,
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
