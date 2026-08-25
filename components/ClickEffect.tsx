"use client";

import { useEffect } from "react";

const EMOJIS = ["❤️", "✨", "🌸", "💖", "⭐", "💜"];
const MAX_ACTIVE = 24;

/** 鼠标点击动画：点击处扩散一圈涟漪 + 随机 emoji 飘起（尊重系统减少动效设置） */
export default function ClickEffect() {
  useEffect(() => {
    let active = 0;

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return; // 仅左键
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (active >= MAX_ACTIVE) return; // 防堆积

      const { clientX: x, clientY: y } = e;
      const root = document.body;

      // 涟漪圆环
      const ring = document.createElement("span");
      ring.className = "click-ring";
      ring.style.left = `${x - 26}px`;
      ring.style.top = `${y - 26}px`;

      // 飘起 emoji
      const emoji = document.createElement("span");
      emoji.className = "click-emoji";
      emoji.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      emoji.style.left = `${x - 10 + (Math.random() * 24 - 12)}px`;
      emoji.style.top = `${y - 18}px`;

      root.appendChild(ring);
      root.appendChild(emoji);
      active += 2;

      const cleanup = () => {
        ring.remove();
        emoji.remove();
        active -= 2;
      };
      ring.addEventListener("animationend", cleanup, { once: true });
      emoji.addEventListener("animationend", cleanup, { once: true });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
