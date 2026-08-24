"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { coverGradients } from "@/lib/site";
import type { Post } from "@/lib/types";

import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const EMOJIS = ["📝", "🌸", "🎵", "🖼️", "🌙", "☀️", "💻", "🎮", "📚", "🍰", "✨", "🐱"];

interface Props {
  postId: string; // "new" 表示新建
}

export default function PostEditor({ postId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(postId !== "new");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"cover" | "content" | null>(null);
  const [err, setErr] = useState("");
  const coverInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    tags: "",
    date: new Date().toISOString().slice(0, 10),
    coverEmoji: "🌸",
    coverGradient: coverGradients[0],
    coverImage: "",
    content: "",
  });

  useEffect(() => {
    if (postId === "new") return;
    fetch(`/api/posts/${postId}`)
      .then((r) => r.json())
      .then((data) => {
        const p = data.post as Post | undefined;
        if (p) {
          setForm({
            title: p.title,
            slug: p.slug,
            tags: p.tags.join(", "),
            date: p.date,
            coverEmoji: p.coverEmoji,
            coverGradient: p.coverGradient,
            coverImage: p.coverImage || "",
            content: p.content,
          });
        }
      })
      .catch(() => setErr("加载文章失败"))
      .finally(() => setLoading(false));
  }, [postId]);

  /** 上传图片，返回可访问 URL；失败抛错 */
  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "上传失败");
    return data.url as string;
  };

  const onUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading("cover");
    setErr("");
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, coverImage: url }));
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "上传失败");
    } finally {
      setUploading(null);
    }
  };

  const onUploadContent = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading("content");
    setErr("");
    try {
      const url = await uploadImage(file);
      setForm((f) => ({
        ...f,
        content: `${f.content}\n\n![图片](${url})\n`,
      }));
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "上传失败");
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    if (!form.title.trim()) {
      setErr("标题不能为空");
      return;
    }
    if (!form.content.trim()) {
      setErr("正文不能为空");
      return;
    }
    setSaving(true);
    setErr("");
    const body = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      tags: form.tags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
      date: form.date,
      coverEmoji: form.coverEmoji,
      coverGradient: form.coverGradient,
      coverImage: form.coverImage || undefined,
      content: form.content,
    };
    try {
      const res =
        postId === "new"
          ? await fetch("/api/posts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            })
          : await fetch(`/api/posts/${postId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "保存失败");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setErr("保存失败，请检查网络");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-loading">加载中…</div>;

  return (
    <div className="post-editor">
      <div className="editor-head">
        <h2>{postId === "new" ? "✍️ 写新文章" : "✏️ 编辑文章"}</h2>
        <div className="editor-head-actions">
          <button className="btn" onClick={() => router.push("/admin")}>
            返回列表
          </button>
          <button className="btn primary" onClick={() => void save()} disabled={saving}>
            {saving ? "保存中…" : "💾 保存"}
          </button>
        </div>
      </div>

      {err && <div className="form-error">{err}</div>}

      <div className="editor-fields glass">
        <label>
          标题 *
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="文章标题"
          />
        </label>

        {/* 封面图片上传 */}
        <div className="cover-upload">
          <span className="editor-pick-label">封面图片（可选，上传后优先于图标/渐变显示）</span>
          {form.coverImage ? (
            <div className="cover-upload-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.coverImage} alt="封面预览" />
              <div className="cover-upload-actions">
                <button
                  className="btn small"
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploading === "cover"}
                >
                  {uploading === "cover" ? "上传中…" : "更换图片"}
                </button>
                <button
                  className="btn small danger"
                  type="button"
                  onClick={() => setForm({ ...form, coverImage: "" })}
                >
                  移除
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn small"
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploading === "cover"}
            >
              {uploading === "cover" ? "上传中…" : "🖼 上传封面图片"}
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
            onChange={(e) => void onUploadCover(e)}
            style={{ display: "none" }}
          />
        </div>

        <div className="editor-row">
          <label>
            Slug（网址后缀，留空自动生成）
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="my-first-post"
            />
          </label>
          <label>
            日期
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </label>
          <label>
            标签（逗号分隔）
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="二次元, 日常"
            />
          </label>
        </div>
        <div className="editor-row">
          <div className="editor-pick">
            <span className="editor-pick-label">封面图标</span>
            <div className="emoji-picker">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  className={form.coverEmoji === e ? "on" : ""}
                  onClick={() => setForm({ ...form, coverEmoji: e })}
                  type="button"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="editor-pick">
            <span className="editor-pick-label">封面渐变</span>
            <div className="gradient-picker">
              {coverGradients.map((g, i) => (
                <button
                  key={i}
                  className={form.coverGradient === g ? "on" : ""}
                  style={{ background: g }}
                  onClick={() => setForm({ ...form, coverGradient: g })}
                  type="button"
                  aria-label={`渐变 ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="editor-md glass" data-color-mode="light">
        <div className="editor-md-toolbar">
          <span className="editor-pick-label">正文（Markdown）</span>
          <button
            className="btn small"
            type="button"
            onClick={() => contentInputRef.current?.click()}
            disabled={uploading === "content"}
          >
            {uploading === "content" ? "上传中…" : "🖼 上传图片到正文"}
          </button>
          <input
            ref={contentInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
            onChange={(e) => void onUploadContent(e)}
            style={{ display: "none" }}
          />
        </div>
        <MDEditor
          value={form.content}
          onChange={(v) => setForm({ ...form, content: v || "" })}
          height={480}
          preview="live"
          textareaProps={{ placeholder: "用 Markdown 写正文吧…" }}
        />
      </div>
    </div>
  );
}
