"use client";

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
 * 用于导航 logo / 首页 Hero / 封面，配置变化时实时同步。
 */
export default function Avatar({ emoji, className, alt }: Props) {
  const cfg = useSiteConfig();
  const image = cfg?.avatar?.trim();

  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={alt || "头像"} className={`${className ?? ""} avatar-img`} />;
  }
  return <span className={className}>{emoji}</span>;
}
