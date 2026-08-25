"use client";

import { useEffect } from "react";

/** 注册 Service Worker（PWA 离线/安装支持）；仅在正式环境启用，避免开发期缓存干扰 */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        // 新版本 SW 就绪后自动刷新页面，让用户拿到最新代码
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          window.location.reload();
        });
      })
      .catch(() => {
        /* 注册失败不影响使用 */
      });
  }, []);
  return null;
}
