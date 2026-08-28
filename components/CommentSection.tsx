"use client";

import { useCallback, useEffect, useState } from "react";
import type { Comment } from "@/lib/types";

export default function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  // 回复状态
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string } | null>(null);
  const [replyName, setReplyName] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyErr, setReplyErr] = useState("");

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
      if (saved) {
        setName(saved);
        setReplyName(saved);
      }
    } catch {
      /* ignore */
    }
  }, [load]);

  const saveName = (n: string) => {
    try {
      localStorage.setItem("blog-comment-name", n);
    } catch {
      /* ignore */
    }
  };

  const postComment = async (payload: {
    name: string;
    content: string;
    parentId?: string;
    replyTo?: string;
  }) => {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "发表失败");
    return data;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      setErr("昵称和评论内容不能为空");
      return;
    }
    setSubmitting(true);
    setErr("");
    try {
      await postComment({ name: name.trim(), content: content.trim() });
      setContent("");
      saveName(name.trim());
      await load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "发表失败");
    } finally {
      setSubmitting(false);
    }
  };

  const openReply = (c: Comment) => {
    setReplyTarget({ id: c.id, name: c.name });
    setReplyName(name.trim() || "");
    setReplyContent(`@${c.name} `);
    setReplyErr("");
  };

  const cancelReply = () => {
    setReplyTarget(null);
    setReplyContent("");
    setReplyErr("");
  };

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget) return;
    if (!replyName.trim() || !replyContent.trim()) {
      setReplyErr("昵称和回复内容不能为空");
      return;
    }
    setReplySubmitting(true);
    setReplyErr("");
    try {
      await postComment({
        name: replyName.trim(),
        content: replyContent.trim(),
        parentId: replyTarget.id,
        replyTo: replyTarget.name,
      });
      saveName(replyName.trim());
      setName(replyName.trim());
      cancelReply();
      await load();
    } catch (e2) {
      setReplyErr(e2 instanceof Error ? e2.message : "回复失败");
    } finally {
      setReplySubmitting(false);
    }
  };

  const all = comments ?? [];
  const top = all.filter((c) => !c.parentId);
  const childrenOf = (id: string) => all.filter((c) => c.parentId === id);

  const renderItems = (items: Comment[], depth: number) =>
    items.map((c) => {
      const kids = childrenOf(c.id);
      const indent = depth > 0 ? Math.min(depth, 3) * 30 : 0;
      return (
        <li key={c.id} className="comment-item" style={indent ? { marginLeft: `${indent}px` } : undefined}>
          <div className="comment-row">
            <span className="comment-avatar" aria-hidden>
              {c.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="comment-body">
              <div className="comment-head">
                <b>{c.name}</b>
                <time>{new Date(c.createdAt).toLocaleString("zh-CN")}</time>
              </div>
              {c.replyTo && <div className="comment-replyto">回复 @{c.replyTo}</div>}
              <p className="comment-content">{c.content}</p>
              <button type="button" className="comment-reply-btn" onClick={() => openReply(c)}>
                ↩ 回复
              </button>
            </div>
          </div>

          {replyTarget?.id === c.id && (
            <form className="comment-reply-form" onSubmit={submitReply}>
              <input
                value={replyName}
                onChange={(e) => setReplyName(e.target.value)}
                placeholder="你的昵称 *"
                maxLength={30}
              />
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="回复内容 *"
                maxLength={1000}
                rows={2}
                autoFocus
              />
              {replyErr && <div className="form-error">{replyErr}</div>}
              <div className="comment-reply-foot">
                <span className="comment-hint">回复 @{c.name}</span>
                <span className="comment-reply-actions">
                  <button type="button" className="comment-cancel" onClick={cancelReply}>
                    取消
                  </button>
                  <button className="btn primary small" type="submit" disabled={replySubmitting}>
                    {replySubmitting ? "发表中…" : "回复"}
                  </button>
                </span>
              </div>
            </form>
          )}

          {kids.length > 0 && <ul className="comment-children">{renderItems(kids, depth + 1)}</ul>}
        </li>
      );
    });

  return (
    <section className="comments glass">
      <h3 className="comments-title">
        💬 评论 <span className="comments-count">{comments === null ? "" : `(${all.length})`}</span>
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
        {comments !== null && renderItems(top, 0)}
        {comments !== null && all.length === 0 && (
          <li className="comment-empty">还没有评论，来抢沙发～ 🛋️</li>
        )}
      </ul>
    </section>
  );
}
