import Link from "next/link";
import type { Post } from "@/lib/types";

export default function PostCard({ post }: { post: Post }) {
  const hasImage = !!post.coverImage;

  return (
    <Link href={`/posts/${post.slug}`} className="post-card glass">
      <div
        className={`post-cover ${hasImage ? "has-image" : ""}`}
        style={
          hasImage
            ? { backgroundImage: `url(${post.coverImage})` }
            : { background: post.coverGradient }
        }
        aria-hidden
      >
        {!hasImage && <span className="post-cover-emoji">{post.coverEmoji}</span>}
      </div>
      <div className="post-body">
        <h3 className="post-title">{post.title}</h3>
        <p className="post-excerpt">{post.excerpt}</p>
        <div className="post-meta">
          <span className="post-date">📅 {post.date}</span>
          <span className="post-tags">
            {post.tags.map((t) => (
              <span key={t} className="tag">
                #{t}
              </span>
            ))}
          </span>
        </div>
      </div>
    </Link>
  );
}
