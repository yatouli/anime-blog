import Link from "next/link";
import { getRecentComments } from "@/lib/store";

/** 首页卡片：最新评论 */
export default async function CommentsPreview() {
  const comments = await getRecentComments(4);

  return (
    <section className="home-card glass">
      <div className="home-card-head">
        <h3>💬 最新评论</h3>
        <Link href="/posts" className="home-card-more">
          去评论 →
        </Link>
      </div>
      {comments.length === 0 ? (
        <p className="home-card-empty">还没有评论，去文章里抢沙发吧～</p>
      ) : (
        <ul className="home-comments">
          {comments.map((c) => (
            <li key={c.id} className="home-comment">
              <span className="home-comment-avatar">{c.name.slice(0, 1).toUpperCase()}</span>
              <div className="home-comment-body">
                <b>{c.name}</b>
                <p>
                  {c.replyTo ? (
                    <>
                      <span className="home-comment-reply">回复 @{c.replyTo}</span> {c.content}
                    </>
                  ) : (
                    c.content
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
