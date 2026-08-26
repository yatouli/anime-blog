import CommentsPreview from "@/components/CommentsPreview";
import FriendsPreview from "@/components/FriendsPreview";
import PhotoPreview from "@/components/PhotoPreview";
import PostCard from "@/components/PostCard";
import ProfileCard from "@/components/ProfileCard";
import SiteStats from "@/components/SiteStats";
import { getConfig, getPosts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [posts, { albums, gallery }] = await Promise.all([getPosts(), getConfig()]);
  // 首页轮播图片：优先合并所有分类的图片，否则回退 gallery
  const carouselItems = albums.length > 0 ? albums.flatMap((a) => a.photos) : gallery;

  return (
    <>
      {/* 搜索栏 */}
      <form action="/search" className="home-search glass" role="search">
        <input type="search" name="q" placeholder="🔍 搜索文章 / 标签…" />
        <button type="submit" className="btn primary small">
          搜索
        </button>
      </form>

      {/* 第一行：个人信息 + 最新评论 */}
      <div className="home-grid">
        <div className="home-span-8">
          <ProfileCard />
        </div>
        <div className="home-span-4">
          <CommentsPreview />
        </div>
      </div>

      {/* 第二行：图片墙 + 右列（最新文章 + 友链/数据） */}
      <div className="home-grid">
        <div className="home-span-5">
          <PhotoPreview items={carouselItems} />
        </div>
        <div className="home-span-7 home-col">
          <section className="home-card glass">
            <div className="home-card-head">
              <h3>✨ 最近文章</h3>
              <a className="home-card-more" href="/posts">
                查看全部 →
              </a>
            </div>
            <div className="home-posts">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
          <div className="home-grid">
            <div className="home-span-8">
              <FriendsPreview />
            </div>
            <div className="home-span-4">
              <SiteStats />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
