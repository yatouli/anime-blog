import Link from "next/link";
import PostCard from "@/components/PostCard";
import ProfileCard from "@/components/ProfileCard";
import { getPosts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = (await getPosts()).slice(0, 3);

  return (
    <>
      {/* 首屏：个人名片卡片（头像/名字/介绍/统计/社交） */}
      <ProfileCard />

      {/* 最近文章 */}
      <section className="section">
        <div className="section-head">
          <h2>✨ 最近文章</h2>
          <Link href="/posts" className="section-more">
            查看全部 →
          </Link>
        </div>
        <div className="post-grid">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      </section>

      {/* 站点特色 */}
      <section className="section">
        <div className="section-head">
          <h2>🎀 这个小窝有什么</h2>
        </div>
        <div className="feature-grid">
          <Link href="/posts" className="feature glass">
            <span className="feature-icon">📝</span>
            <h3>写文章</h3>
            <p>后台可视化编辑，Markdown 加持，网格卡片展示。</p>
          </Link>
          <Link href="/gallery" className="feature glass">
            <span className="feature-icon">🎵</span>
            <h3>听音乐</h3>
            <p>底部常驻播放器，网易云音乐在线搜索点播。</p>
          </Link>
          <Link href="/gallery" className="feature glass">
            <span className="feature-icon">🖼️</span>
            <h3>图片墙</h3>
            <p>重叠拼贴 ⇄ 网格布局，一键切换的壁纸收藏夹。</p>
          </Link>
          <Link href="/friends" className="feature glass">
            <span className="feature-icon">🤝</span>
            <h3>交换友链</h3>
            <p>提交你的小站，和更多有趣的人相遇。</p>
          </Link>
        </div>
      </section>
    </>
  );
}
