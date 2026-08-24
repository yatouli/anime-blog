import type { Metadata } from "next";
import "./globals.css";
import IntroCover from "@/components/IntroCover";
import Nav from "@/components/Nav";
import MusicPlayer from "@/components/MusicPlayer";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    default: `${site.name} · ${site.slogan}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  alternates: {
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
};

const themeScript = `(function(){try{var t=localStorage.getItem('blog-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {/* 背景层：渐变 + 光斑 + 花瓣 */}
        <div className="bg" aria-hidden>
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="star star-1" />
          <div className="star star-2" />
          <div className="star star-3" />
          <div className="star star-4" />
          <div className="petal petal-1">🌸</div>
          <div className="petal petal-2">🌸</div>
          <div className="petal petal-3">🌸</div>
          <div className="petal petal-4">🌸</div>
          <div className="petal petal-5">🌸</div>
        </div>

        <Nav />

        <IntroCover />

        <main className="main">{children}</main>

        <footer className="footer glass">
          © {site.since}–{new Date().getFullYear()} {site.name} · 用 💖 和 Next.js
          搭建 · <a href="/admin">后台</a>
        </footer>

        <MusicPlayer />
      </body>
    </html>
  );
}
