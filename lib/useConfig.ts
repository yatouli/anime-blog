"use client";

import { useSyncExternalStore } from "react";
import {
  getConfigSnapshot,
  subscribeConfig,
} from "@/lib/config";
import type { SiteConfig } from "@/lib/types";

/** 订阅站点配置（由 Background 组件拉取后共享），实时更新 */
export function useSiteConfig(): SiteConfig | null {
  return useSyncExternalStore(
    subscribeConfig,
    getConfigSnapshot,
    // SSR / 水合阶段没有客户端配置，返回 null（渲染 emoji 占位）
    () => null
  );
}
