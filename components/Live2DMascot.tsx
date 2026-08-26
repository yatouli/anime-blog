"use client";

import { useEffect, useRef, useState } from "react";

const MODEL_URL = "/live2d/shizuku/shizuku.model.json";

/** Live2D 看板娘（白咲黑猫 Shizuku）：右下角常驻，点击互动，可隐藏/召唤 */
export default function Live2DMascot() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<{ motion: (g: string, i?: number) => void; focus: () => void } | null>(null);
  const [hidden, setHidden] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [bubble, setBubble] = useState("");

  useEffect(() => {
    let cancelled = false;
    let app: any = null;

    const load = async () => {
      try {
        const PIXI = await import("pixi.js");
        const { Live2DModel } = await import("pixi-live2d-display/cubism2");

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        app = new PIXI.Application({
          view: canvas,
          autoStart: true,
          resizeTo: window,
          backgroundAlpha: 0,
          antialias: true,
        });

        const model = await Live2DModel.from(MODEL_URL, { autoInteract: true });
        if (cancelled) return;

        // 尺寸：桌面高 ~360px，手机 ~260px
        const scale = window.innerWidth < 768 ? 0.16 : 0.22;
        model.scale.set(scale);
        model.anchor.set(0.5, 0.5);
        model.x = canvas.clientWidth / 2;
        model.y = canvas.clientHeight;

        app.stage.addChild(model);
        modelRef.current = {
          motion: (g: string, i?: number) => model.motion(g, i),
          focus: () => model.focus(0, 0),
        };
        setLoaded(true);
      } catch (e) {
        console.error("Live2D 加载失败:", e);
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (app) {
        try {
          app.destroy(true);
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const interact = () => {
    if (!modelRef.current) return;
    const groups = ["tap_body", "pinch_in", "pinch_out", "shake", "flick_head"];
    const g = groups[Math.floor(Math.random() * groups.length)];
    modelRef.current.motion(g);
    modelRef.current.focus();
    const msgs = [
      "喵～ 摸我干嘛！",
      "哼哼，手感不错吧～",
      "别戳啦，痒痒的…",
      "要听听音乐吗？",
      "去写篇文章吧！",
      "人家可是会动的看板娘哦",
    ];
    setBubble(msgs[Math.floor(Math.random() * msgs.length)]);
    window.setTimeout(() => setBubble(""), 3200);
  };

  return (
    <>
      {!hidden && (
        <div className="live2d-wrap">
          {bubble && <div className="pet-bubble" onClick={() => setBubble("")}>{bubble}</div>}
          <canvas
            ref={canvasRef}
            className="live2d-canvas"
            onClick={interact}
            aria-label="Live2D 看板娘"
            title="点击互动"
          />
          <button className="pet-hide" onClick={() => setHidden(true)} title="隐藏看板娘">
            ✕
          </button>
          {!loaded && <div className="live2d-loading">加载中…</div>}
        </div>
      )}
      {hidden && (
        <button className="pet-show" onClick={() => setHidden(false)} title="召唤看板娘">
          ✨
        </button>
      )}
    </>
  );
}
