"use client";

import { useMemo, useState } from "react";
import { useSiteConfig } from "@/lib/useConfig";

interface Props {
  /** 无自定义头像时显示的 emoji */
  emoji: string;
  /** 附加到外层元素的 class（span 或 img 都会带上） */
  className?: string;
  alt?: string;
}

/**
 * 站点头像：配置了图片头像就显示图片，否则回退为 emoji。
 * - 图片加载失败自动回退 emoji（不显示破图）
 * - 懒加载 + 异步解码，不阻塞首屏
 * 用于导航 logo / 首页 Hero / 封面，配置变化时实时同步。
 */
export default function Avatar({ emoji, className, alt }: Props) {
  const cfg = useSiteConfig();
  const image = cfg?.avatar?.trim();
  const [failed, setFailed] = useState(false);

  // 头像地址变化时重置失败状态
  const imageKey = useMemo(() => image, [image]);

  if (image && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={imageKey}
        src={image}
        alt={alt || "头像"}
        className={`${className ?? ""} avatar-img`}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }
  return <span className={className}>{emoji}</span>;
}
