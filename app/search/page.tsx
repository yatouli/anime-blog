import type { Metadata } from "next";
import PostCard from "@/components/PostCard";
import { getPosts } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "搜索" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const kw = (q ?? "").trim().toLowerCase();

  const all = await getPosts();
  const posts = all.filter((p) => {
    if (!kw) return true;
    const haystack = [p.title, p.excerpt, p.content, p.tags.join(" ")]
      .join("\n")
      .toLowerCase();
    return haystack.includes(kw);
  });

  return (
    <>
      <header className="page-head">
        <h1>🔍 搜索文章</h1>
        <p>按标题、正文、标签搜索</p>
        <form action="/search" className="search-form glass" role="search">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="输入关键词，如：二次元 / 图片墙 / 音乐…"
            autoFocus
          />
          <button type="submit" className="btn primary">
            搜索
          </button>
        </form>
      </header>

      <div className="search-meta">
        {kw ? (
          <p>
            关键词「<b>{kw}</b>」找到 {posts.length} 篇文章
          </p>
        ) : (
          <p>输入关键词开始搜索～</p>
        )}
      </div>

      <div className="post-grid">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>

      {kw && posts.length === 0 && (
        <div className="empty glass">没有找到相关文章，换个关键词试试？</div>
      )}
    </>
  );
}
