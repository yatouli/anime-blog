import {
  getCommentCount,
  getConfig,
  getFriends,
  getPosts,
} from "@/lib/store";
import { site } from "@/lib/site";

/** 首页卡片：站点数据面板（文章/评论/友链/壁纸 + 建站天数） */
export default async function SiteStats() {
  const [posts, friends, commentCount, { gallery }] = await Promise.all([
    getPosts(),
    getFriends(),
    getCommentCount(),
    getConfig(),
  ]);
  const days = Math.max(
    1,
    Math.floor((Date.now() - new Date(`${site.since}-01-01`).getTime()) / 86400000)
  );

  const stats = [
    { n: posts.length, label: "文章", color: "var(--accent)" },
    { n: friends.length, label: "友链", color: "var(--accent-2)" },
    { n: gallery.length, label: "壁纸", color: "#ffb020" },
    { n: commentCount, label: "评论", color: "#34d399" },
  ];

  return (
    <section className="home-card glass">
      <div className="home-card-head">
        <h3>📊 站点数据</h3>
        <span className="home-card-since">已陪伴 {days} 天</span>
      </div>
      <div className="home-stats">
        {stats.map((s) => (
          <div key={s.label} className="home-stat">
            <div className="home-stat-num" style={{ color: s.color }}>
              {s.n}
            </div>
            <div className="home-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
