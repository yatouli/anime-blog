"use client";

import { useState } from "react";
import type { WallItem } from "@/lib/types";

/** 拼贴模式下每张图的位置/旋转（预设的错落排布） */
const MOSAIC = [
  { top: "4%", left: "6%", w: "34%", r: -6 },
  { top: "2%", left: "46%", w: "42%", r: 4 },
  { top: "30%", left: "2%", w: "30%", r: 5 },
  { top: "36%", left: "38%", w: "26%", r: -4 },
  { top: "22%", left: "70%", w: "26%", r: 7 },
  { top: "58%", left: "8%", w: "28%", r: -5 },
  { top: "62%", left: "42%", w: "30%", r: 3 },
  { top: "56%", left: "76%", w: "20%", r: -3 },
];

export default function GalleryWall({ items }: { items: WallItem[] }) {
  const [mode, setMode] = useState<"mosaic" | "grid">("mosaic");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const openLightbox = (i: number) => setLightbox(i);

  return (
    <div>
      {/* 顶部控制条 */}
      <div className="gallery-bar glass">
        <div className="gallery-hint">
          {mode === "mosaic"
            ? "🖼 点击任意一张，拼贴墙会展开成网格"
            : "🗂 网格模式：点击图片查看大图"}
        </div>
        <button
          className="gallery-toggle"
          onClick={() => setMode(mode === "mosaic" ? "grid" : "mosaic")}
        >
          {mode === "mosaic" ? "展开为网格 ⤢" : "收起为拼贴 ⤡"}
        </button>
      </div>

      {/* 图片墙本体 */}
      <div className={`gallery-wall ${mode}`}>
        {items.map((it, i) => {
          const pos = MOSAIC[i % MOSAIC.length];
          return (
            <figure
              key={it.src + i}
              className="gallery-tile"
              style={
                mode === "mosaic"
                  ? {
                      top: pos.top,
                      left: pos.left,
                      width: pos.w,
                      transform: `rotate(${pos.r}deg)`,
                    }
                  : undefined
              }
              onClick={() => (mode === "mosaic" ? setMode("grid") : openLightbox(i))}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.src} alt={it.title} loading="lazy" />
              <figcaption>{it.title}</figcaption>
            </figure>
          );
        })}
      </div>

      {/* 灯箱 */}
      {lightbox !== null && (
        <div
          className="lightbox"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightbox(null);
          }}
        >
          <button
            className="lightbox-close"
            onClick={() => setLightbox(null)}
            aria-label="关闭"
          >
            ✕
          </button>
          <button
            className="lightbox-nav prev"
            onClick={() =>
              setLightbox((lightbox - 1 + items.length) % items.length)
            }
            aria-label="上一张"
          >
            ‹
          </button>
          <div className="lightbox-body">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={items[lightbox].src} alt={items[lightbox].title} />
            <div className="lightbox-title">{items[lightbox].title}</div>
          </div>
          <button
            className="lightbox-nav next"
            onClick={() => setLightbox((lightbox + 1) % items.length)}
            aria-label="下一张"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
