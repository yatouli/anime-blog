"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      localStorage.setItem("blog-theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={dark ? "切换到白天模式" : "切换到夜间模式"}
      title={dark ? "切换到白天模式" : "切换到夜间模式"}
    >
      <span className="theme-icon">{dark ? "☀️" : "🌙"}</span>
    </button>
  );
}
