"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Post } from "@/lib/types";

export default function AdminPostList() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch {
      setPosts([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const del = async (p: Post) => {
    if (!confirm(`确定删除《${p.title}》吗？此操作不可恢复。`)) return;
    try {
      const res = await fetch(`/api/posts/${p.id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg("已删除 ✅");
        void load();
      } else {
        setMsg("删除失败（权限或网络问题）");
      }
    } catch {
      setMsg("删除失败");
    }
  };

  if (posts === null) return <div className="admin-loading">加载中…</div>;

  return (
    <div className="admin-panel">
      <div className="admin-head">
        <h2>📝 文章管理</h2>
        <Link href="/admin/edit/new" className="btn">
          ＋ 写新文章
        </Link>
      </div>
      {msg && <div className="admin-msg">{msg}</div>}
      <div className="admin-post-list">
        {posts.length === 0 && (
          <div className="admin-empty glass">
            还没有文章，点右上角「写新文章」开始吧！
          </div>
        )}
        {posts.map((p) => (
          <div key={p.id} className="admin-post glass">
            <span
              className="admin-post-emoji"
              style={{ background: p.coverGradient }}
            >
              {p.coverEmoji}
            </span>
            <div className="admin-post-info">
              <div className="admin-post-title">{p.title}</div>
              <div className="admin-post-sub">
                {p.date} · {p.tags.join(" / ")} · /posts/{p.slug}
              </div>
            </div>
            <div className="admin-post-actions">
              <Link href={`/posts/${p.slug}`} className="btn small">
                查看
              </Link>
              <Link href={`/admin/edit/${p.id}`} className="btn small">
                编辑
              </Link>
              <button className="btn small danger" onClick={() => void del(p)}>
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
