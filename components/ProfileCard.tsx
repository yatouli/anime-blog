import Link from "next/link";
import Avatar from "@/components/Avatar";
import TypingText from "@/components/TypingText";
import { getConfig, getFriends, getPosts } from "@/lib/store";
import { site } from "@/lib/site";

/** 首页个人名片卡片：渐变描边头像 + 名字 + 打字机介绍 + 真实数据统计 + 社交图标 */
export default async function ProfileCard() {
  const [posts, friends, { gallery }] = await Promise.all([
    getPosts(),
    getFriends(),
    getConfig(),
  ]);

  const stats = [
    { n: posts.length, label: "文章", color: "var(--accent)" },
    { n: friends.length, label: "友链", color: "var(--accent-2)" },
    { n: gallery.length, label: "壁纸", color: "#ffb020" },
  ];

  return (
    <section className="profile-card glass">
      <div className="profile-top">
        <div className="profile-avatar-ring">
          <Avatar emoji={site.avatar} className="profile-avatar" alt={site.author} />
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{site.name}</h1>
          <p className="profile-desc">
            <TypingText
              text={site.slogan}
              speed={90}
              deleteSpeed={55}
              startDelay={1100}
              holdTime={2600}
              loop
            />
          </p>
        </div>
      </div>

      <div className="profile-bottom">
        <div className="profile-stats">
          {stats.map((s) => (
            <div key={s.label} className="profile-stat">
              <div className="profile-stat-num" style={{ color: s.color }}>
                {s.n}
              </div>
              <div className="profile-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="profile-actions">
          <Link href="/posts" className="btn primary small">
            📖 开始阅读
          </Link>
          <Link href="/archive" className="btn small">
            🗂️ 归档
          </Link>
        </div>

        <div className="profile-social">
          {site.github && (
            <a
              href={site.github}
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </a>
          )}
          {site.bilibili && (
            <a
              href={site.bilibili}
              target="_blank"
              rel="noopener noreferrer"
              title="Bilibili"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <path d="M8 5L6 2M16 5l2-3" strokeLinecap="round" />
                <path d="M10 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" />
              </svg>
            </a>
          )}
          {site.email && (
            <a href={`mailto:${site.email}`} title="Email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
