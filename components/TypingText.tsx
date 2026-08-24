"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  /** 每个字符间隔毫秒数 */
  speed?: number;
  /** 删除时每个字符间隔毫秒数（默认与 speed 相同） */
  deleteSpeed?: number;
  /** 延迟多久后开始打字 */
  startDelay?: number;
  /** 打完 / 删空后停顿的毫秒数 */
  holdTime?: number;
  /** 是否循环：打完 → 停顿 → 逐个删除 → 再重新打 */
  loop?: boolean;
  /** 打字完成后是否继续显示光标 */
  caret?: boolean;
}

/**
 * 打字机效果：逐字显示文本，带闪烁光标。
 * - loop 开启后持续循环（打出 → 停顿 → 删除 → 重打）
 * - 支持 startDelay 与 Hero/封面入场动画同步
 * - 用户开启「减少动态效果」时直接显示全文
 */
export default function TypingText({
  text,
  speed = 110,
  deleteSpeed,
  startDelay = 0,
  holdTime = 2200,
  loop = false,
  caret = true,
}: Props) {
  const [shown, setShown] = useState("");
  const [visible, setVisible] = useState(startDelay === 0);
  const mounted = useRef(true);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    mounted.current = true;
    timers.current = [];

    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timers.current.push(id);
    };

    // 尊重系统「减少动态效果」偏好：直接显示全文，不循环
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setVisible(true);
      setShown(text);
      return;
    }

    const delSpeed = deleteSpeed ?? speed;

    const run = () => {
      if (!mounted.current) return;
      setVisible(true);
      let i = 0;
      let deleting = false;

      const step = () => {
        if (!mounted.current) return;
        if (!deleting) {
          i += 1;
          setShown(text.slice(0, i));
          if (i >= text.length) {
            if (loop) {
              // 打完停顿，然后开始删除
              later(() => {
                deleting = true;
                later(step, delSpeed);
              }, holdTime);
            }
            return;
          }
          later(step, speed);
        } else {
          i -= 1;
          setShown(text.slice(0, i));
          if (i <= 0) {
            // 删空停顿，然后重新打
            later(() => {
              deleting = false;
              later(step, speed);
            }, holdTime);
            return;
          }
          later(step, delSpeed);
        }
      };

      later(step, speed);
    };

    if (startDelay > 0) {
      later(run, startDelay);
    } else {
      run();
    }

    return () => {
      mounted.current = false;
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, [text, speed, deleteSpeed, startDelay, holdTime, loop]);

  return (
    <span className={`typing-text ${visible ? "" : "hidden"}`}>
      {shown}
      {caret && <span className="typing-caret" aria-hidden />}
    </span>
  );
}
