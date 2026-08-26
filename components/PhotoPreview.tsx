"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { WallItem } from "@/lib/types";

/** 首页卡片：图片墙轮播预览（自动播放 + 箭头/圆点手动切换） */
export default function PhotoPreview({ items }: { items: WallItem[] }) {
  const [idx, setIdx] = useState(0);
  const n = items.length;

  useEffect(() => {
    if (n < 2) return;
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
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.src} alt={it.title} loading="lazy" />
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
