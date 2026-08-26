"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Album, WallItem } from "@/lib/types";

/**
 * 首页卡片：图片墙轮播预览。
 * 电脑端轮播「竖屏」分类，手机端轮播「横屏」分类（找不到对应分类时用全部图片）。
 */
export default function PhotoPreview({ albums }: { albums: Album[] }) {
  const [isMobile, setIsMobile] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const items: WallItem[] = useMemo(() => {
    const target = isMobile ? "横屏" : "竖屏";
    const album = albums.find((a) => a.name.includes(target));
    if (album && album.photos.length > 0) return album.photos;
    // 找不到对应分类：回退全部图片
    return albums.flatMap((a) => a.photos);
  }, [albums, isMobile]);

  const n = items.length;

  useEffect(() => {
    if (n < 2) return;
    setIdx((i) => (i >= n ? 0 : i));
    const timer = window.setInterval(() => setIdx((i) => (i + 1) % n), 4000);
    return () => window.clearInterval(timer);
  }, [n]);

  return (
    <section className="home-card glass">
      <div className="home-card-head">
        <h3>🖼️ 图片墙</h3>
        <Link href="/gallery" className="home-card-more">
          全部 →
        </Link>
      </div>

      {n === 0 ? (
        <p className="home-card-empty">还没有壁纸～</p>
      ) : (
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
      )}
    </section>
  );
}
