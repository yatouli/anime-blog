// 反向代理：Cloudflare Worker -> Vercel 上的博客
// 用户通过 CF 边缘访问（国内可达），Worker 转发到 Vercel（全球可达）
const ORIGIN = "https://anime-blog-sigma.vercel.app";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = ORIGIN + url.pathname + url.search;

    const headers = new Headers(request.headers);
    headers.set("Host", new URL(ORIGIN).host);

    const resp = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "manual",
    });

    const outHeaders = new Headers(resp.headers);
    for (const h of ["connection", "keep-alive", "transfer-encoding", "upgrade"]) {
      outHeaders.delete(h);
    }
    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: outHeaders,
    });
  },
};
