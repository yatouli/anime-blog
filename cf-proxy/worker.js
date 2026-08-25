// 反向代理：Cloudflare Worker -> Vercel 上的博客
// 用户通过 CF 边缘访问（国内可达），Worker 转发到 Vercel（全球可达）
// 静态资源（_next/static、icons、wall）在 CF 边缘缓存，加速二次访问
const ORIGIN = "https://anime-blog-sigma.vercel.app";
const STATIC_CACHE = "anime-blog-static-v1";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = ORIGIN + url.pathname + url.search;

    // 静态资源：缓存优先（stale-while-revalidate）
    const isStatic =
      url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname.startsWith("/wall/") ||
      url.pathname.startsWith("/manifest.webmanifest");

    if (isStatic && request.method === "GET") {
      const cache = caches.default;
      const cacheKey = new Request(target, { method: "GET" });
      const hit = await cache.match(cacheKey);
      if (hit) return hit;
      const resp = await fetch(target, {
        method: "GET",
        headers: { Host: new URL(ORIGIN).host },
      });
      if (resp.ok) {
        const copy = resp.clone();
        const headers = new Headers(copy.headers);
        headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
        await cache.put(cacheKey, new Response(copy.body, { status: copy.status, statusText: copy.statusText, headers }));
      }
      return resp;
    }

    // 动态页面/API：直接转发（不缓存，保证登录态与最新数据）
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
