import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "@/components/PostCard";
import { getPosts } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  return { title: `#${decodeURIComponent(tag)}` };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const tagName = decodeURIComponent(tag);
  const posts = (await getPosts()).filter((p) => p.tags.includes(tagName));
  if (posts.length === 0) notFound();

  return (
    <>
      <header className="page-head">
        <h1>
          <span className="tag big">#{tagName}</span>
        </h1>
        <p>
          共 {posts.length} 篇文章 ·{" "}
          <Link href="/tags" className="section-more">
            ← 全部标签
          </Link>
        </p>
      </header>

      <div className="post-grid">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </>
  );
}
