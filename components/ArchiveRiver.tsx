"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Post } from "@/lib/types";

/* ── 分类标签颜色 ── */
const CAT_COLORS: Record<string, string> = {
  教程: "#60a5fa",
  技术: "#22d3ee",
  音乐: "#f472b6",
  二次元: "#a78bfa",
  设计: "#34d399",
  公告: "#fbbf24",
  日常: "#fb923c",
};

function catColor(tags: string[]): string {
  return CAT_COLORS[tags[0] || ""] || "#f472b6";
}

function fmtDate(date: string): string {
  const d = new Date(date + "T00:00:00");
  if (isNaN(d.getTime())) return date;
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

/* ── 河流路径：三段正弦叠加，形成自然的弯曲 ── */
function buildRiverPath(
  totalWidth: number,
  riverY: number,
  amplitude: number,
  wavelength: number,
  offsetY = 0,
  stepSize = 6
): string {
  const parts: string[] = [];
  const steps = Math.max(1, Math.ceil(totalWidth / stepSize));
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * totalWidth;
    const y =
      riverY +
      amplitude * 0.5 * Math.sin((x / wavelength) * Math.PI * 2) +
      amplitude * 0.3 * Math.sin((x / (wavelength * 0.6)) * Math.PI * 2 + 1) +
      amplitude * 0.2 * Math.sin((x / (wavelength * 1.5)) * Math.PI * 2 + 2.5);
    parts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${(y + offsetY).toFixed(1)}`);
  }
  return parts.join(" ");
}

function waveYAt(cx: number, riverY: number, amplitude: number, wavelength: number): number {
  return (
    riverY +
    amplitude * 0.5 * Math.sin((cx / wavelength) * Math.PI * 2) +
    amplitude * 0.3 * Math.sin((cx / (wavelength * 0.6)) * Math.PI * 2 + 1) +
    amplitude * 0.2 * Math.sin((cx / (wavelength * 1.5)) * Math.PI * 2 + 2.5)
  );
}

/** 时光河流归档：横向河流曲线 + 上下交替卡片（原生滚动浏览） */
export default function ArchiveRiver() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    fetch("/api/posts")
      .then((r) => r.json())
      .then((d) => setPosts(Array.isArray(d.posts) ? d.posts : []))
      .catch(() => setPosts([]));
    return () => window.removeEventListener("resize", check);
  }, []);

  const sorted = useMemo(() => [...(posts ?? [])], [posts]);

  const CARD_W = isMobile ? 170 : 240;
  const CARD_H = isMobile ? 190 : 230;
  const CARD_GAP = isMobile ? 40 : 60;
  const RIVER_Y = isMobile ? 190 : 240;
  const SVG_TOP = -100;
  const AMPLITUDE = isMobile ? 50 : 80;
  const WAVELENGTH = isMobile ? 400 : 600;
  const PADDING = isMobile ? 300 : 600;

  const totalWidth =
    PADDING * 2 + Math.max(0, sorted.length) * (CARD_W + CARD_GAP) - (sorted.length ? CARD_GAP : 0);
  const svgHeight = RIVER_Y + AMPLITUDE + CARD_H + 120 - SVG_TOP;

  const riverPath = useMemo(
    () => buildRiverPath(totalWidth, RIVER_Y, AMPLITUDE, WAVELENGTH, 0, isMobile ? 20 : 6),
    [totalWidth, RIVER_Y, AMPLITUDE, WAVELENGTH, isMobile]
  );
  const riverPathBottom = useMemo(
    () => buildRiverPath(totalWidth, RIVER_Y, AMPLITUDE, WAVELENGTH, 12, isMobile ? 20 : 6),
    [totalWidth, RIVER_Y, AMPLITUDE, WAVELENGTH, isMobile]
  );

  if (posts === null) {
    return (
      <div className="admin-loading">
        <span className="river-loading-dot" />
        时光河流加载中…
      </div>
    );
  }

  return (
    <div className="river-wrap">
      <header className="page-head">
        <h1>🗂️ 归档</h1>
        <p>时光河流 · 共 {sorted.length} 篇文章</p>
      </header>

      {sorted.length === 0 ? (
        <div className="empty glass">还没有文章，去写第一篇吧～</div>
      ) : (
        <>
          <div className="river-scroll">
            <div className="river-canvas" style={{ width: totalWidth, height: svgHeight }}>
              <svg
                width={totalWidth}
                height={svgHeight}
                viewBox={`0 ${SVG_TOP} ${totalWidth} ${svgHeight}`}
                className="river-svg"
              >
                <defs>
                  <linearGradient id="river-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ff7ab8" stopOpacity="0" />
                    <stop offset="5%" stopColor="#ff7ab8" stopOpacity="0.5" />
                    <stop offset="50%" stopColor="#8a7bff" stopOpacity="0.6" />
                    <stop offset="95%" stopColor="#ff7ab8" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#ff7ab8" stopOpacity="0" />
                  </linearGradient>
                  {!isMobile && (
                    <filter id="river-glow" x="-5%" y="-20%" width="110%" height="140%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
                    </filter>
                  )}
                </defs>

                {/* 河流主体（绘制动画） */}
                <path
                  d={riverPath}
                  fill="none"
                  stroke="url(#river-grad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  pathLength={1}
                  className="river-draw"
                />
                {/* 发光层（PC） */}
                {!isMobile && (
                  <path
                    d={riverPath}
                    fill="none"
                    stroke="url(#river-grad)"
                    strokeWidth="20"
                    filter="url(#river-glow)"
                    opacity="0.3"
                    className="river-fade"
                  />
                )}
                {/* 底部微光 */}
                <path
                  d={riverPathBottom}
                  fill="none"
                  stroke="url(#river-grad)"
                  strokeWidth="1"
                  opacity="0.15"
                  className="river-fade"
                />

                {/* 流动粒子（PC） */}
                {!isMobile && (
                  <>
                    {[0, 0.3, 0.6].map((offset, i) => (
                      <circle key={i} r="3" fill="#ff7ab8" opacity="0.7">
                        <animateMotion
                          dur={`${8 + i * 1.5}s`}
                          repeatCount="indefinite"
                          begin={`${offset * (8 + i * 1.5)}s`}
                          rotate="auto"
                        >
                          <mpath href="#river-flow-path" />
                        </animateMotion>
                      </circle>
                    ))}
                    <path id="river-flow-path" d={riverPath} fill="none" stroke="none" />
                  </>
                )}

                {/* 文章卡片 */}
                {sorted.map((post, i) => {
                  const x = PADDING + i * (CARD_W + CARD_GAP);
                  const cx = x + CARD_W / 2;
                  const waveY = waveYAt(cx, RIVER_Y, AMPLITUDE, WAVELENGTH);
                  const isAbove = i % 2 === 0;
                  const cardY = isAbove ? waveY - (isMobile ? 28 : 50) - CARD_H : waveY + (isMobile ? 28 : 50);
                  const color = catColor(post.tags);
                  const dateStr = fmtDate(post.date);
                  const hasCover = !!post.coverImage;

                  return (
                    <g key={post.id} className="river-node">
                      {/* 虚线连接线 */}
                      <line
                        x1={cx}
                        y1={isAbove ? cardY + CARD_H : cardY}
                        x2={cx}
                        y2={waveY}
                        stroke={color}
                        strokeWidth="1.5"
                        opacity="0.4"
                        strokeDasharray="4 3"
                      />
                      {/* 河流节点 */}
                      <circle cx={cx} cy={waveY} r="6" fill="#ffffff" />
                      <circle cx={cx} cy={waveY} r="10" fill={color} opacity="0.25" />
                      {/* 时间标注 */}
                      <text
                        x={cx}
                        y={waveY + (isAbove ? 22 : -12)}
                        textAnchor="middle"
                        fill={color}
                        fontSize={isMobile ? 9 : 11}
                        fontWeight="700"
                      >
                        {dateStr}
                      </text>

                      {/* 卡片 */}
                      <foreignObject x={x} y={cardY} width={CARD_W} height={CARD_H} style={{ overflow: "visible" }}>
                        <div className="river-card">
                          <Link
                            href={`/posts/${post.slug}`}
                            className="river-card-inner"
                            style={{ height: CARD_H }}
                          >
                            <div
                              className="river-card-cover"
                              style={
                                hasCover
                                  ? { backgroundImage: `url(${post.coverImage})` }
                                  : { background: post.coverGradient }
                              }
                            >
                              {!hasCover && <span className="river-card-emoji">{post.coverEmoji}</span>}
                              <span className="river-card-date-badge">📅 {dateStr}</span>
                            </div>
                            <div className="river-card-body">
                              <h3 className="river-card-title">{post.title}</h3>
                              <p className="river-card-excerpt">{post.excerpt}</p>
                              <div className="river-card-foot">
                                {post.tags[0] && (
                                  <span className="river-card-tag" style={{ color, background: `${color}1a` }}>
                                    {post.tags[0]}
                                  </span>
                                )}
                                <span className="river-card-views">👁 {post.views}</span>
                              </div>
                            </div>
                          </Link>
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <p className="river-hint">↔ 左右滑动浏览时光河流 · 点击卡片阅读全文</p>
        </>
      )}
    </div>
  );
}
