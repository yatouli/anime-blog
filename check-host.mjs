const reqId = "48b979d1k633";
const host = "anime-blog-sigma.vercel.app";

const res = await fetch("https://check-host.net/check-result/" + reqId, {
  headers: { Accept: "application/json", "User-Agent": "anime-blog" },
  signal: AbortSignal.timeout(30000),
});
const data = await res.json();
let any = false;
for (const [node, results] of Object.entries(data || {})) {
  for (const item of results || []) {
    const status = item?.[0];
    const time = item?.[1] ?? 0;
    const ok = status === "OK" || status === "1";
    any = true;
    console.log(node.padEnd(24), ok ? "可达 ✅" : "超时/失败 ❌", String(status), time + "ms");
  }
}
if (!any) console.log("暂无结果（等待）:", JSON.stringify(data).slice(0, 200));
