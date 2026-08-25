import type { Metadata } from "next";
import PostCard from "@/components/PostCard";
import { getPosts } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "文章" };

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <>
      <header className="page-head">
        <h1>📖 文章</h1>
        <p>共 {posts.length} 篇 · 网格布局，点击卡片阅读全文</p>
      </header>
      <div className="post-grid">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
      {posts.length === 0 && (
        <div className="empty glass">还没有文章，去后台写第一篇吧～</div>
      )}
    </>
  );
}
