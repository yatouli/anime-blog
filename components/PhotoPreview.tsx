"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Album, WallItem } from "@/lib/types";

/** 取指定名称的分类图片；找不到时回退全部 */
function pick(albums: Album[], name: string): WallItem[] {
  const a = albums.find((x) => x.name.includes(name));
  return a && a.photos.length > 0 ? a.photos : albums.flatMap((x) => x.photos);
}

/** 单个轮播 */
function Carousel({ items }: { items: WallItem[] }) {
  const [idx, setIdx] = useState(0);
  const n = items.length;

  useEffect(() => {
    if (n < 2) return;
    setIdx((i) => (i >= n ? 0 : i));
    const timer = window.setInterval(() => setIdx((i) => (i + 1) % n), 4000);
    return () => window.clearInterval(timer);
  }, [n]);

  if (n === 0) return <p className="home-card-empty">还没有壁纸～</p>;

  return (
    <div className="photo-carousel">
      {items.map((it, i) => (
        <Link
          key={it.src + i}
          href="/gallery"
          className={`photo-carousel-slide ${i === idx ? "active" : ""}`}
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={it.src}
            alt={it.title}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </Link>
      ))}

      {n > 1 && (
        <>
          <button
            className="carousel-arrow prev"
            onClick={() => setIdx((idx - 1 + n) % n)}
            aria-label="上一张"
          >
            ‹
          </button>
          <button
            className="carousel-arrow next"
            onClick={() => setIdx((idx + 1) % n)}
            aria-label="下一张"
          >
            ›
          </button>
          <div className="carousel-dots">
            {items.map((_, i) => (
              <button
                key={i}
                className={i === idx ? "on" : ""}
                onClick={() => setIdx(i)}
                aria-label={`第 ${i + 1} 张`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 首页卡片：图片墙轮播预览。
 * 电脑端显示「竖屏」分类，手机端显示「横屏」分类——
 * 两个轮播同时渲染，用 CSS 媒体查询切换显示，不依赖 JS 设备检测。
 */
export default function PhotoPreview({ albums }: { albums: Album[] }) {
  const desktopItems = pick(albums, "竖屏");
  const mobileItems = pick(albums, "横屏");

  return (
    <section className="home-card glass">
      <div className="home-card-head">
        <h3>🖼️ 图片墙</h3>
        <Link href="/gallery" className="home-card-more">
          全部 →
        </Link>
      </div>

      <div className="carousel-desktop">
        <Carousel items={desktopItems} />
      </div>
      <div className="carousel-mobile">
        <Carousel items={mobileItems} />
      </div>
    </section>
  );
}
