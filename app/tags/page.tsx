import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "标签归档" };

export default async function TagsPage() {
  const posts = await getPosts();

  // 统计所有标签及文章数
  const counts = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.tags) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...tags.map(([, n]) => n));

  return (
    <>
      <header className="page-head">
        <h1>🏷️ 标签归档</h1>
        <p>共 {tags.length} 个标签 · {posts.length} 篇文章</p>
      </header>

      {tags.length === 0 ? (
        <div className="empty glass">还没有标签，去写文章吧～</div>
      ) : (
        <div className="tag-cloud glass">
          {tags.map(([tag, n]) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="tag-cloud-item"
              style={{
                fontSize: `${13 + (n / max) * 14}px`,
                opacity: 0.65 + (n / max) * 0.35,
              }}
            >
              #{tag}
              <span className="tag-cloud-count">{n}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
