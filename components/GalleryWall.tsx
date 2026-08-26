"use client";

import { useMemo, useState } from "react";
import type { WallItem } from "@/lib/types";

/** 每个相册最多几张 */
const PER_ALBUM = 6;

/** 相册封面堆叠参数（参考站 AlbumCard） */
const STACK = [
  { rotate: -4, y: 0, scale: 1, z: 1 },
  { rotate: 0, y: 12, scale: 0.96, z: 2 },
  { rotate: 3, y: 24, scale: 0.92, z: 3 },
];

/** 拍立得轻微旋转 */
const rotOf = (i: number) => (((i * 37) % 5) - 2) * 0.9;

export default function GalleryWall({ items }: { items: WallItem[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<{ album: number; photo: number } | null>(null);

  // 自动分组为相册
  const albums = useMemo(() => {
    const list: WallItem[][] = [];
    for (let i = 0; i < items.length; i += PER_ALBUM) {
      list.push(items.slice(i, i + PER_ALBUM));
    }
    return list;
  }, [items]);

  if (albums.length === 0) {
    return <div className="empty glass">图片墙还是空的，去后台设置上传壁纸吧～</div>;
  }

  const openLightbox = (album: number, photo: number) => setLightbox({ album, photo });
  const closeLightbox = () => setLightbox(null);
  const lightboxPhotos = lightbox ? albums[lightbox.album] : null;
  const lightboxIndex = lightbox ? lightbox.photo : 0;

  return (
    <div>
      <div className="album-grid">
        {albums.map((album, ai) => {
          const isOpen = expanded === ai;
          const covers = album.slice(0, 3).reverse();
          const title = album[0]?.title || `相册 ${ai + 1}`;

          return (
            <figure
              key={`${album[0]?.src}-${ai}`}
              className={`album-card glass ${isOpen ? "open" : ""}`}
              onClick={() => setExpanded(isOpen ? null : ai)}
            >
              {/* 封面：堆叠照片 */}
              <div className="album-cover">
                {covers.map((it, ci) => {
                  const st = STACK[STACK.length - 1 - ci] ?? STACK[0];
                  return (
                    <div
                      key={it.src + ci}
                      className="album-cover-photo"
                      style={{
                        zIndex: st.z,
                        transform: `rotate(${st.rotate}deg) translateY(${st.y}px) scale(${st.scale})`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.src} alt={it.title} loading="lazy" />
                    </div>
                  );
                })}
                <span className="album-count">{album.length} 张</span>
              </div>

              {/* 相册信息 */}
              <div className="album-info">
                <h3>{title}</h3>
                <p>{album.length} 张壁纸 · 点击展开</p>
              </div>

              {/* 展开的照片网格（拍立得） */}
              {isOpen && (
                <div className="album-photos" onClick={(e) => e.stopPropagation()}>
                  {album.map((it, pi) => (
                    <figure
                      key={it.src + pi}
                      className="gallery-tile polaroid"
                      style={{ "--rot": `${rotOf(pi)}deg` } as React.CSSProperties}
                      onClick={() => openLightbox(ai, pi)}
                    >
                      <span className="polaroid-tape" aria-hidden />
                      <div className="polaroid-inner">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.src} alt={it.title} loading="lazy" />
                        <figcaption>{it.title}</figcaption>
                      </div>
                    </figure>
                  ))}
                </div>
              )}
            </figure>
          );
        })}
      </div>

      {/* 灯箱 */}
      {lightbox && lightboxPhotos && (
        <div
          className="lightbox"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLightbox();
          }}
        >
          <button className="lightbox-close" onClick={closeLightbox} aria-label="关闭">
            ✕
          </button>
          <button
            className="lightbox-nav prev"
            onClick={() =>
              setLightbox({
                album: lightbox.album,
                photo: (lightbox.photo - 1 + lightboxPhotos.length) % lightboxPhotos.length,
              })
            }
            aria-label="上一张"
          >
            ‹
          </button>
          <div className="lightbox-body">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightboxPhotos[lightboxIndex].src} alt={lightboxPhotos[lightboxIndex].title} />
            <div className="lightbox-title">{lightboxPhotos[lightboxIndex].title}</div>
          </div>
          <button
            className="lightbox-nav next"
            onClick={() =>
              setLightbox({
                album: lightbox.album,
                photo: (lightbox.photo + 1) % lightboxPhotos.length,
              })
            }
            aria-label="下一张"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
