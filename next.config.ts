import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 输出 standalone：方便国内服务器 Docker / 精简部署（Vercel 同样兼容）
  output: "standalone",
};

export default nextConfig;
