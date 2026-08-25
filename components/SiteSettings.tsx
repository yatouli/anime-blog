"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { applyConfig, bgGradients, DEFAULT_CONFIG, setConfig } from "@/lib/config";
import type { SiteConfig, WallItem } from "@/lib/types";

/** 站点设置：背景 / 模糊 / 压暗 / 头像 / 图片墙，改动即时预览 */
export default function SiteSettings() {
  const [cfg, setCfg] = useState<SiteConfig | null>(null);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState<"bg" | "avatar" | "gallery" | null>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => {
        const c = d?.config as SiteConfig;
        if (c) {
          setCfg(c);
          setConfig(c);
          applyConfig(c);
        }
      })
      .catch(() => setErr("加载配置失败"));
  }, []);

  const preview = useCallback((next: SiteConfig) => {
    setCfg(next);
    setConfig(next);
    applyConfig(next);
  }, []);

  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "上传失败");
    return data.url as string;
  };

  const onUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !cfg) return;
    setUploading("bg");
    setErr("");
    try {
      const url = await uploadImage(file);
      preview({ ...cfg, image: url, backgroundType: "image" });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "上传失败");
    } finally {
      setUploading(null);
    }
  };

  const onUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !cfg) return;
    setUploading("avatar");
    setErr("");
    try {
      const url = await uploadImage(file);
      preview({ ...cfg, avatar: url });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "上传失败");
    } finally {
      setUploading(null);
    }
  };

  /** 读取图片真实尺寸，用于图片墙的比例元数据 */
  const getDims = (url: string) =>
    new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth || 3, h: img.naturalHeight || 4 });
      img.onerror = () => resolve({ w: 3, h: 4 });
      img.src = url;
    });

  const onUploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length || !cfg) return;
    setUploading("gallery");
    setErr("");
    try {
      const added: WallItem[] = [];
      for (const file of files) {
        const url = await uploadImage(file);
        const { w, h } = await getDims(url);
        const title = file.name.replace(/\.[^.]+$/, "") || "未命名";
        added.push({ src: url, title, w, h });
      }
      preview({ ...cfg, gallery: [...cfg.gallery, ...added].slice(0, 100) });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "上传失败");
    } finally {
      setUploading(null);
    }
  };

  const removeGalleryItem = (idx: number) => {
    if (!cfg) return;
    const next = cfg.gallery.filter((_, i) => i !== idx);
    preview({ ...cfg, gallery: next });
  };

  const save = async () => {
    if (!cfg) return;
    setSaved(false);
    setErr("");
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存失败");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "保存失败");
    }
  };

  const reset = () => {
    if (!cfg) return;
    const def: SiteConfig = {
      backgroundType: "gradient",
      gradient: "",
      image: "",
      blur: 0,
      overlay: 0,
      avatar: "",
      gallery: [...DEFAULT_CONFIG.gallery],
    };
    preview(def);
  };

  if (!cfg) return <div className="admin-loading">加载中…</div>;

  const hasImage = cfg.backgroundType === "image" && !!cfg.image;

  return (
    <div className="site-settings">
      <div className="admin-head">
        <h2>🎨 站点设置 · 背景</h2>
        <div className="editor-head-actions">
          <button className="btn" onClick={reset}>
            恢复默认
          </button>
          <button className="btn primary" onClick={() => void save()}>
            💾 保存设置
          </button>
        </div>
      </div>

      {saved && <div className="admin-msg">已保存 ✅（刷新后所有页面生效）</div>}
      {err && <div className="form-error">{err}</div>}

      <div className="settings-grid">
        {/* 背景类型 */}
        <section className="glass settings-card">
          <h3>背景类型</h3>
          <div className="settings-type">
            <button
              className={cfg.backgroundType === "gradient" ? "on" : ""}
              onClick={() => preview({ ...cfg, backgroundType: "gradient" })}
            >
              🌈 渐变背景
            </button>
            <button
              className={cfg.backgroundType === "image" ? "on" : ""}
              onClick={() => preview({ ...cfg, backgroundType: "image" })}
            >
              🖼 图片背景
            </button>
          </div>

          {cfg.backgroundType === "gradient" ? (
            <div className="settings-block">
              <span className="editor-pick-label">选择渐变（留空 = 跟随昼夜主题）</span>
              <div className="gradient-picker">
                {bgGradients.map((g, i) => (
                  <button
                    key={i}
                    className={cfg.gradient === g ? "on" : ""}
                    style={{ background: g }}
                    onClick={() => preview({ ...cfg, gradient: g })}
                    type="button"
                    aria-label={`渐变 ${i + 1}`}
                  />
                ))}
              </div>
              <button
                className="btn small"
                onClick={() => preview({ ...cfg, gradient: "" })}
              >
                使用主题默认渐变
              </button>
            </div>
          ) : (
            <div className="settings-block">
              <span className="editor-pick-label">背景图片</span>
              {hasImage ? (
                <div className="cover-upload-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cfg.image} alt="背景预览" className="bg-preview-img" />
                  <div className="cover-upload-actions">
                    <button
                      className="btn small"
                      onClick={() => bgFileRef.current?.click()}
                      disabled={uploading === "bg"}
                    >
                      {uploading === "bg" ? "上传中…" : "更换图片"}
                    </button>
                    <button
                      className="btn small danger"
                      onClick={() =>
                        preview({ ...cfg, image: "", backgroundType: "gradient" })
                      }
                    >
                      移除
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn small"
                  onClick={() => bgFileRef.current?.click()}
                  disabled={uploading === "bg"}
                >
                  {uploading === "bg" ? "上传中…" : "🖼 上传背景图片"}
                </button>
              )}
              <p className="settings-hint">
                建议使用较宽的横图（如 1920×1080 壁纸），图片会铺满整个屏幕。
              </p>
              <input
                ref={bgFileRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                onChange={(e) => void onUploadBg(e)}
                style={{ display: "none" }}
              />
            </div>
          )}
        </section>

        {/* 模糊与压暗 */}
        <section className="glass settings-card">
          <h3>模糊与可读性</h3>

          <div className="slider-row">
            <div className="slider-head">
              <span>背景模糊</span>
              <b>{cfg.blur}px</b>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              step={1}
              value={cfg.blur}
              onChange={(e) => preview({ ...cfg, blur: Number(e.target.value) })}
              style={{ ["--fill" as string]: `${(cfg.blur / 40) * 100}%` }}
            />
            <p className="settings-hint">
              数值越大背景越朦胧（0 清晰 / 20 磨砂 / 40 几乎纯色）
            </p>
          </div>

          <div className="slider-row">
            <div className="slider-head">
              <span>压暗程度</span>
              <b>{Math.round(cfg.overlay * 100)}%</b>
            </div>
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.05}
              value={cfg.overlay}
              onChange={(e) => preview({ ...cfg, overlay: Number(e.target.value) })}
              style={{ ["--fill" as string]: `${(cfg.overlay / 0.8) * 100}%` }}
            />
            <p className="settings-hint">
              背景太亮看不清字时调高它，相当于给背景盖一层深色纱
            </p>
          </div>

          <div className="settings-note">
            💡 所有改动即时预览，满意后点「保存设置」。
            <br />
            小技巧：图片背景 + 模糊 8~15px + 压暗 20~35% 是最舒服的毛玻璃组合。
          </div>
        </section>

        {/* 头像 */}
        <section className="glass settings-card avatar-card">
          <h3>👤 头像</h3>
          <div className="avatar-setting">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {cfg.avatar ? (
              <img src={cfg.avatar} alt="头像预览" className="avatar-preview-img" />
            ) : (
              <span className="avatar-preview-emoji">🌸</span>
            )}
            <div className="avatar-setting-info">
              <p className="settings-hint">
                显示在导航栏、首页 Hero 和封面动画上。
                <br />
                上传图片后自动替换 emoji 头像。
              </p>
              <div className="cover-upload-actions">
                <button
                  className="btn small"
                  onClick={() => avatarFileRef.current?.click()}
                  disabled={uploading === "avatar"}
                >
                  {uploading === "avatar" ? "上传中…" : cfg.avatar ? "更换头像" : "🖼 上传头像"}
                </button>
                {cfg.avatar && (
                  <button
                    className="btn small danger"
                    onClick={() => preview({ ...cfg, avatar: "" })}
                  >
                    恢复 emoji
                  </button>
                )}
              </div>
            </div>
          </div>
          <input
            ref={avatarFileRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
            onChange={(e) => void onUploadAvatar(e)}
            style={{ display: "none" }}
          />
        </section>

        {/* 图片墙 */}
        <section className="glass settings-card avatar-card">
          <div className="gallery-settings-head">
            <h3>🖼️ 图片墙</h3>
            <div className="cover-upload-actions">
              <button
                className="btn small"
                onClick={() => galleryFileRef.current?.click()}
                disabled={uploading === "gallery"}
              >
                {uploading === "gallery" ? "上传中…" : "＋ 上传图片（可多选）"}
              </button>
              <button
                className="btn small"
                onClick={() => preview({ ...cfg, gallery: [...DEFAULT_CONFIG.gallery] })}
              >
                恢复默认壁纸
              </button>
            </div>
          </div>
          <p className="settings-hint">
            支持 jpg / png / webp（含 gif / svg），无大小限制；上传后自动出现在「图片墙」页面。
          </p>
          <input
            ref={galleryFileRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
            onChange={(e) => void onUploadGallery(e)}
            style={{ display: "none" }}
          />
          {cfg.gallery.length > 0 ? (
            <div className="gallery-manage-grid">
              {cfg.gallery.map((it, i) => (
                <div key={`${it.src}-${i}`} className="gallery-manage-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.src} alt={it.title} />
                  <div className="gallery-manage-info">
                    <span className="gallery-manage-title" title={it.title}>
                      {it.title}
                    </span>
                    <button
                      className="gallery-manage-del"
                      onClick={() => removeGalleryItem(i)}
                      title="从图片墙移除"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="settings-hint">图片墙为空，点上方按钮上传吧～</p>
          )}
        </section>
      </div>
    </div>
  );
}
