"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import Avatar from "./Avatar";
import TypingText from "./TypingText";

/**
 * 博客封面入场动画：
 * 页面加载时先展示一张毛玻璃封面（头像 + 博客名 + 标语），
 * 约 1.5s 后自动上滑揭幕；点击封面可立即跳过。
 */
export default function IntroCover() {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  const dismiss = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => setGone(true), 700);
  };

  useEffect(() => {
    const t = window.setTimeout(dismiss, 1500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  return (
    <div
      className={`intro-cover ${leaving ? "leaving" : ""}`}
      onClick={dismiss}
      role="button"
      aria-label="跳过封面动画"
    >
      <div className="intro-cover-inner">
        <Avatar emoji={site.avatar} className="intro-cover-avatar" alt={site.name} />
        <h1 className="intro-cover-name">{site.name}</h1>
        <p className="intro-cover-slogan">
          <TypingText text={site.slogan} speed={70} startDelay={500} />
        </p>
        <div className="intro-cover-sparkle" aria-hidden>
          ✨
        </div>
      </div>
      <div className="intro-cover-hint">点击任意位置，立即进入 →</div>
    </div>
  );
}
