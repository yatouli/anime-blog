"use client";

import { useEffect, useState } from "react";

interface Props {
  /** nav：导航栏紧凑时钟；greeting：首页时段问候 */
  variant?: "nav" | "greeting";
}

/**
 * 实时时钟：每秒更新，显示访问者本地时间。
 * SSR 阶段渲染占位，挂载后填充，避免水合不一致。
 */
export default function Clock({ variant = "nav" }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!now) {
    // 占位：保持布局稳定，避免水合闪烁
    return (
      <span
        className={variant === "greeting" ? "clock-greeting" : "clock"}
        aria-hidden
      />
    );
  }

  if (variant === "greeting") {
    const h = now.getHours();
    const greet =
      h < 5
        ? "夜深了"
        : h < 9
          ? "早上好"
          : h < 12
            ? "上午好"
            : h < 14
              ? "中午好"
              : h < 18
                ? "下午好"
                : "晚上好";
    const dateStr = now.toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "long",
    });
    const timeStr = now.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return (
      <span className="clock-greeting">
        👋 {greet}！现在是 {dateStr} {timeStr}
      </span>
    );
  }

  const timeStr = now.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const dateStr = now.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  return (
    <span className="clock" title={dateStr}>
      🕐 {timeStr}
    </span>
  );
}
