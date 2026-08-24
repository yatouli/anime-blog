import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "关于" };

export default function AboutPage() {
  return (
    <>
      <header className="page-head">
        <h1>💌 关于</h1>
      </header>

      <div className="about-grid">
        <section className="glass about-card">
          <div className="about-avatar">{site.avatar}</div>
          <h2>你好呀，我是 {site.author}</h2>
          <p>{site.slogan}</p>
          <p>
            这个博客从 {site.since} 年开始陪伴我，记录技术、生活与二次元的小确幸。
            整个站点用 Next.js 搭建，主打毛玻璃质感与昼夜模式，希望你喜欢这个小小的窝。
          </p>
          <div className="about-links">
            <a href={site.github} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href={site.bilibili} target="_blank" rel="noopener noreferrer">
              Bilibili
            </a>
            <a href={`mailto:${site.email}`}>Email</a>
          </div>
        </section>

        <section className="glass about-card">
          <h2>🛠 技术栈</h2>
          <ul className="tech-list">
            <li>Next.js 15 · App Router · TypeScript</li>
            <li>毛玻璃：backdrop-filter + CSS 变量主题</li>
            <li>Markdown 渲染：react-markdown + remark-gfm</li>
            <li>后台编辑器：@uiw/react-md-editor</li>
            <li>音乐：服务端代理网易云音乐官方接口</li>
            <li>数据：本地 JSON 文件存储（可平滑迁移数据库）</li>
          </ul>
        </section>

        <section className="glass about-card">
          <h2>📮 联系我</h2>
          <p>
            想交流、投稿或者申请友链？发邮件到{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a>，我会尽快回复！
          </p>
        </section>
      </div>
    </>
  );
}
