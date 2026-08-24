"use client";

import { useCallback, useEffect, useState } from "react";
import type { Comment } from "@/lib/types";

export default function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`);
      const data = await res.json();
      setComments(Array.isArray(data.comments) ? data.comments : []);
    } catch {
      setComments([]);
    }
  }, [postId]);

  useEffect(() => {
    void load();
    // 记住昵称，下次不用再输
    try {
      const saved = localStorage.getItem("blog-comment-name");
      if (saved) setName(saved);
    } catch {
      /* ignore */
    }
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      setErr("昵称和评论内容不能为空");
      return;
    }
    setSubmitting(true);
    setErr("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, name: name.trim(), content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "发表失败");
        return;
      }
      setContent("");
      try {
        localStorage.setItem("blog-comment-name", name.trim());
      } catch {
        /* ignore */
      }
      await load();
    } catch {
      setErr("网络异常，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="comments glass">
      <h3 className="comments-title">
        💬 评论 <span className="comments-count">{comments === null ? "" : `(${comments.length})`}</span>
      </h3>

      <form className="comment-form" onSubmit={submit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="你的昵称 *"
          maxLength={30}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="友善交流，理性发言～ *"
          maxLength={1000}
          rows={3}
        />
        {err && <div className="form-error">{err}</div>}
        <div className="comment-form-foot">
          <span className="comment-hint">评论会保存到本站，无需登录</span>
          <button className="btn primary small" type="submit" disabled={submitting}>
            {submitting ? "发表中…" : "发表评论"}
          </button>
        </div>
      </form>

      <ul className="comment-list">
        {comments === null && <li className="comment-empty">加载中…</li>}
        {comments !== null &&
          comments.map((c) => (
            <li key={c.id} className="comment-item">
              <span className="comment-avatar" aria-hidden>
                {c.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="comment-body">
                <div className="comment-head">
                  <b>{c.name}</b>
                  <time>{new Date(c.createdAt).toLocaleString("zh-CN")}</time>
                </div>
                <p className="comment-content">{c.content}</p>
              </div>
            </li>
          ))}
        {comments !== null && comments.length === 0 && (
          <li className="comment-empty">还没有评论，来抢沙发～ 🛋️</li>
        )}
      </ul>
    </section>
  );
}
