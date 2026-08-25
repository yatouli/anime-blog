"use client";

import { useEffect } from "react";
import { applyConfig, setConfig } from "@/lib/config";
import type { SiteConfig } from "@/lib/types";

/** 页面加载时读取站点配置：应用到背景（图片/模糊/压暗/渐变），并共享给头像等组件 */
export default function Background() {
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        const cfg = data?.config as SiteConfig | undefined;
        if (cfg) {
          setConfig(cfg);
          applyConfig(cfg);
        }
      })
      .catch(() => {
        /* 读取失败则保持默认 */
      });
  }, []);
  return null;
}
