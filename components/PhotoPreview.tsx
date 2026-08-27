"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Album, WallItem } from "@/lib/types";

/** 取指定名称的分类图片；找不到时回退全部 */
function pick(albums: Album[], name: string): WallItem[] {
  const a = albums.find((x) => x.name.includes(name));
  return a && a.photos.length > 0 ? a.photos : albums.flatMap((x) => x.photos);
}

/**
 * 单个轮播：参照 boke.hiromu.top 的 PhotoWallPreview ——
 * 玻璃圆角卡片 + 交叉渐隐 + 悬停放大 + 右下角胶囊指示点 + 滑动切换 + 点击进图库。
 */
function Carousel({ items }: { items: WallItem[] }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const n = items.length;
  const startX = useRef(0);
  const endX = useRef(0);
  const didSwipe = useRef(false);
  const isDragging = useRef(false);

  useEffect(() => {
    if (n < 2) return;
    setIdx((i) => (i >= n ? 0 : i));
    const timer = window.setInterval(() => setIdx((i) => (i + 1) % n), 4000);
    return () => window.clearInterval(timer);
  }, [n]);

  // 预加载下一张，切图时不重新请求
  useEffect(() => {
    if (n < 2) return;
    const next = items[(idx + 1) % n];
    if (next?.src) {
      const img = new Image();
      img.src = next.src;
    }
  }, [idx, items, n]);

  const go = (dir: number) => setIdx((i) => (i + dir + n) % n);

  function handlePointerDown(clientX: number) {
    startX.current = clientX;
    endX.current = clientX;
    didSwipe.current = false;
    isDragging.current = true;
  }

  function handlePointerMove(clientX: number) {
    if (!isDragging.current) return;
    endX.current = clientX;
  }

  function handlePointerUp() {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = startX.current - endX.current;
    if (Math.abs(diff) > 40) {
      didSwipe.current = true;
      if (diff > 0) go(1);
      else go(-1);
    }
  }

  function handleClick() {
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    router.push("/gallery");
  }

  if (n === 0) return <p className="home-card-empty">还没有壁纸～</p>;
  const cur = items[idx];

  return (
    <div
      className="photo-carousel"
      style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
      onClick={handleClick}
      onPointerDown={(e) => handlePointerDown(e.clientX)}
      onPointerMove={(e) => handlePointerMove(e.clientX)}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* 只渲染当前一张 + 预加载下一张，避免 12 张图同时加载 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={cur.src + idx}
        src={cur.src}
        alt={cur.title}
        className="photo-carousel-img"
        draggable={false}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />

      {n > 1 && (
        <div className="carousel-dots">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === idx ? "on" : ""}
              onClick={(e) => {
                e.stopPropagation();
                setIdx(i);
              }}
              aria-label={`第 ${i + 1} 张`}
            />
          ))}
        </div>
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
    <section className="home-card glass photo-card">
      <div className="carousel-desktop">
        <Carousel items={desktopItems} />
      </div>
      <div className="carousel-mobile">
        <Carousel items={mobileItems} />
      </div>
    </section>
  );
}
