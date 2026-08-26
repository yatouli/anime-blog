"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";
import Avatar from "./Avatar";
import Clock from "./Clock";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "/", label: "🏠 首页" },
  { href: "/posts", label: "📖 文章" },
  { href: "/archive", label: "🗂️ 归档" },
  { href: "/gallery", label: "🖼️ 图片墙" },
  { href: "/friends", label: "🤝 友链" },
  { href: "/about", label: "💌 关于" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 路由变化时关闭移动端菜单
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className={`nav glass ${open ? "menu-open" : ""}`}>
      <Link href="/" className="nav-logo">
        <Avatar emoji={site.avatar} className="nav-logo-emoji" alt={site.name} />
        <span className="nav-logo-text">{site.name}</span>
      </Link>

      <nav className={`nav-links ${open ? "show" : ""}`}>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`nav-link ${isActive(l.href) ? "active" : ""}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="nav-actions">
        <Clock variant="nav" />
        <Link href="/search" className="nav-search" title="搜索文章">
          🔍
        </Link>
        <ThemeToggle />
        <Link href="/admin" className="nav-admin" title="后台管理">
          ⚙️
        </Link>
        {/* 移动端汉堡按钮 */}
        <button
          className={`nav-burger ${open ? "open" : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "关闭菜单" : "打开菜单"}
          aria-expanded={open}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
