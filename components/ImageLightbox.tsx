"use client";

import { useEffect, useState } from "react";

/**
 * 正文图片灯箱：点击文章内容（.markdown-body）里的图片，打开大图预览。
 * 全局监听点击事件，无需给每张图绑事件。
 */
export default function ImageLightbox() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const img = target?.closest?.(".markdown-body img") as HTMLImageElement | null;
      if (img?.src) {
        e.preventDefault();
        setSrc(img.src);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    // 打开灯箱时锁定页面滚动
    document.body.style.overflow = src ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [src]);

  if (!src) return null;

  return (
    <div
      className="lightbox"
      onClick={(e) => {
        if (e.target === e.currentTarget) setSrc(null);
      }}
    >
      <button className="lightbox-close" onClick={() => setSrc(null)} aria-label="关闭">
        ✕
      </button>
      <div className="lightbox-body">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="图片预览" onClick={(e) => e.stopPropagation()} />
      </div>
    </div>
  );
}
