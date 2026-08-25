"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

const MSGS = [
  "喵～欢迎来到小窝！",
  "点击我说话，拖动我搬家～",
  "去后台写篇文章吧！",
  "听首歌放松一下？点底部播放器",
  "图片墙的新壁纸真好看！",
  "友链申请入口在导航栏哦",
  "夜深了，注意休息喵～",
  "代码写得真好（自己夸自己）",
  "咕噜咕噜…(蹭蹭)",
];

const LS_POS = "anime-blog-pet-pos";
const LS_HIDDEN = "anime-blog-pet-hidden";

/** 轻量桌宠：可拖动、点击说话、随机眨眼、自动冒泡，可隐藏/召唤 */
export default function Pet() {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [hidden, setHidden] = useState(false);
  const [bubble, setBubble] = useState("");
  const [blink, setBlink] = useState(false);
  const [wobble, setWobble] = useState(false);
  const dragRef = useRef<{ offX: number; offY: number; moved: boolean } | null>(null);

  // 初始化：恢复位置与隐藏状态
  useEffect(() => {
    let p: { left: number; top: number } | null = null;
    try {
      const s = localStorage.getItem(LS_POS);
      if (s) p = JSON.parse(s) as { left: number; top: number };
    } catch {
      /* ignore */
    }
    setPos(
      p || {
        left: Math.max(16, window.innerWidth - 128),
        top: Math.max(16, window.innerHeight - 320),
      }
    );
    try {
      if (localStorage.getItem(LS_HIDDEN) === "1") setHidden(true);
    } catch {
      /* ignore */
    }
  }, []);

  // 随机眨眼 + 定时自动说话
  useEffect(() => {
    if (hidden) return;
    let blinkTimer: number;
    let sayTimer: number;

    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(() => {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 150);
        scheduleBlink();
      }, 1800 + Math.random() * 4000);
    };
    const scheduleSay = () => {
      sayTimer = window.setTimeout(() => {
        const msg = MSGS[Math.floor(Math.random() * MSGS.length)];
        setBubble(msg);
        window.setTimeout(() => setBubble(""), 4000);
        scheduleSay();
      }, 25000 + Math.random() * 30000);
    };

    scheduleBlink();
    scheduleSay();
    return () => {
      window.clearTimeout(blinkTimer);
      window.clearTimeout(sayTimer);
    };
  }, [hidden]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!pos) return;
    dragRef.current = {
      offX: e.clientX - pos.left,
      offY: e.clientY - pos.top,
      moved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const left = Math.min(Math.max(0, e.clientX - drag.offX), window.innerWidth - 64);
    const top = Math.min(Math.max(0, e.clientY - drag.offY), window.innerHeight - 64);
    if (Math.abs(e.clientX - drag.offX - pos!.left) > 4) drag.moved = true;
    setPos({ left, top });
  };

  const onPointerUp = () => {
    if (!dragRef.current) return;
    const moved = dragRef.current.moved;
    dragRef.current = null;
    try {
      if (pos) localStorage.setItem(LS_POS, JSON.stringify(pos));
    } catch {
      /* ignore */
    }
    if (moved) {
      setWobble(true);
      window.setTimeout(() => setWobble(false), 500);
    }
  };

  const onClick = () => {
    if (dragRef.current?.moved) return; // 拖动不算点击
    setBubble((b) => (b ? "" : MSGS[Math.floor(Math.random() * MSGS.length)]));
  };

  if (pos === null) return null;

  return (
    <>
      {!hidden && (
        <div className="pet-wrap" style={{ left: pos.left, top: pos.top }}>
          {bubble && (
            <div className="pet-bubble" onClick={() => setBubble("")}>
              {bubble}
            </div>
          )}
          <button
            className={`pet ${wobble ? "wobble" : ""}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onClick={onClick}
            aria-label="桌宠"
            title={`${site.name}的桌宠：拖动我，点击我说话`}
          >
            <span className={`pet-emoji ${blink ? "blink" : ""}`}>🐱</span>
          </button>
          <button className="pet-hide" onClick={() => setHidden(true)} title="隐藏桌宠">
            ✕
          </button>
        </div>
      )}
      {hidden && (
        <button className="pet-show" onClick={() => setHidden(false)} title="召唤桌宠">
          🐱
        </button>
      )}
    </>
  );
}
