"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";
import Clock from "./Clock";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "/", label: "首页" },
  { href: "/posts", label: "文章" },
  { href: "/gallery", label: "图片墙" },
  { href: "/friends", label: "友链" },
  { href: "/about", label: "关于" },
];

export default function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="nav glass">
      <Link href="/" className="nav-logo">
        <span className="nav-logo-emoji">{site.avatar}</span>
        <span className="nav-logo-text">{site.name}</span>
      </Link>

      <nav className="nav-links">
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
      </div>
    </header>
  );
}
