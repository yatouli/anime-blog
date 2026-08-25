import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CommentSection from "@/components/CommentSection";
import MarkdownView from "@/components/MarkdownView";
import PostCard from "@/components/PostCard";
import TocView from "@/components/TocView";
import ViewCounter from "@/components/ViewCounter";
import { getPostBySlug, getPosts } from "@/lib/store";
import { extractHeadings } from "@/lib/toc";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  return { title: post?.title ?? "文章不存在" };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const all = await getPosts();
  const others = all.filter((p) => p.id !== post.id).slice(0, 3);
  const headings = extractHeadings(post.content);
  const hasImage = !!post.coverImage;

  return (
    <article className="post-detail glass">
      <div
        className={`post-detail-cover ${hasImage ? "has-image" : ""}`}
        style={
          hasImage
            ? { backgroundImage: `url(${post.coverImage})` }
            : { background: post.coverGradient }
        }
      >
        {!hasImage && <span className="post-detail-emoji">{post.coverEmoji}</span>}
      </div>

      <div className="post-detail-layout">
        <div className="post-detail-inner">
          <nav className="breadcrumb">
            <Link href="/">首页</Link> / <Link href="/posts">文章</Link> /{" "}
            <span>{post.title}</span>
          </nav>

          <h1 className="post-detail-title">{post.title}</h1>

          <div className="post-detail-meta">
            <span>📅 {post.date}</span>
            <ViewCounter postId={post.id} initialViews={post.views} />
            <span>
              {post.tags.map((t) => (
                <span key={t} className="tag">
                  #{t}
                </span>
              ))}
            </span>
          </div>

          <MarkdownView content={post.content} headings={headings} />

          <div className="post-detail-footer">
            <Link href="/posts" className="btn">
              ← 返回文章列表
            </Link>
          </div>

          <CommentSection postId={post.id} />
        </div>

        {headings.length > 0 && (
          <aside className="post-detail-aside">
            <TocView headings={headings} />
          </aside>
        )}
      </div>

      {others.length > 0 && (
        <aside className="post-related">
          <h3>📚 相关阅读</h3>
          <div className="post-grid mini">
            {others.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </aside>
      )}
    </article>
  );
}
