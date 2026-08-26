import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "归档" };

interface Pt {
  x: number; // 0-100 百分比
  y: number; // SVG 坐标
  up: boolean;
}

/** 用二次贝塞尔把节点连成平滑波浪曲线 */
function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const mx = (prev.x + cur.x) / 2;
    const my = (prev.y + cur.y) / 2;
    d += ` Q ${mx} ${prev.y}, ${mx} ${my}`;
    d += ` Q ${mx} ${cur.y}, ${cur.x} ${cur.y}`;
  }
  return d;
}

export default async function ArchivePage() {
  const posts = await getPosts();
  // 从左到右时间递增（旧 → 新）
  const items = [...posts].reverse();

  const WAVE_TOP = 78;
  const WAVE_BOTTOM = 168;
  const pts: Pt[] = items.map((_, i) => {
    const x = items.length === 1 ? 50 : (i / (items.length - 1)) * 100;
    const up = i % 2 === 0;
    return { x, y: up ? WAVE_TOP : WAVE_BOTTOM, up };
  });

  return (
    <>
      <header className="page-head">
        <h1>🗂️ 归档</h1>
        <p>一条曲线串起的 {items.length} 篇时光 · 从左到右，越写越多</p>
      </header>

      {items.length === 0 ? (
        <div className="empty glass">还没有文章，去写第一篇吧～</div>
      ) : (
        <div className="timeline glass">
          {/* 波浪曲线 */}
          <svg
            className="timeline-line"
            viewBox="0 0 100 260"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="timeline-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#ff7ab8" />
                <stop offset="1" stopColor="#8a7bff" />
              </linearGradient>
            </defs>
            <path
              d={smoothPath(pts)}
              fill="none"
              stroke="url(#timeline-grad)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>

          {/* 节点 */}
          {pts.map((pt, i) => {
            const post = items[i];
            return (
              <div
                key={post.id}
                className={`timeline-node ${pt.up ? "up" : "down"}`}
                style={{ left: `${pt.x}%`, top: `${pt.y}px` }}
              >
                <span className="timeline-dot" />
                <Link href={`/posts/${post.slug}`} className="timeline-card">
                  <span className="timeline-date">📅 {post.date}</span>
                  <span className="timeline-title">{post.title}</span>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
