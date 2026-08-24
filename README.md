# 🌸 星野の小窝 — 二次元风格个人博客

一个基于 **Next.js 15 + TypeScript** 的二次元风毛玻璃博客，功能包括：

- ✨ **毛玻璃质感**：`backdrop-filter` 玻璃卡片 + 渐变光斑背景 + 飘落花瓣
- 🌙 **昼夜模式**：一键切换，自动记住选择，跟随系统偏好
- 🎵 **在线音乐播放器**：底部常驻，服务端代理网易云音乐官方接口，搜索 / 队列 / 进度 / 音量
- 📝 **文章系统**：网格布局卡片，Markdown 渲染，支持标签、封面
- 🖼️ **图片墙**：重叠拼贴 ⇄ 网格两种布局，点击展开，点击看大图（灯箱）
- 🤝 **友链**：友链展示 + 申请表单
- ⚙️ **网页后台编辑器**：`/admin` 密码登录，可视化 Markdown 写作
- 🎬 **封面入场动画**：毛玻璃封面揭幕 + 打字机标语（循环） + 卡片阶梯入场
- 🔍 **站内搜索**：`/search` 按标题 / 正文 / 标签搜索
- 📑 **文章目录 + 代码高亮**：长文自动生成 TOC（滚动高亮当前章节），代码块语法着色
- 📡 **RSS + sitemap**：`/rss.xml` 订阅、`/sitemap.xml` 利于收录
- 💬 **内置评论**：无需登录即可评论，数据存本地
- 🖼 **图片上传**：后台可上传文章封面图与正文插图（存 `data/uploads/`，经 `/api/files` 动态提供）
- 🎨 **自定义背景**：`/admin/settings` 可选渐变预设或上传自己的背景壁纸，可调**模糊程度**与**压暗程度**，实时预览

---

## 🚀 快速开始

```bash
npm install
npm run dev
# 打开 http://localhost:3000
```

生产构建：

```bash
npm run build
npm run start
```

## 🔐 后台管理

- 访问 `/admin`
- 默认密码：`anime2024`（**务必修改！**）
- 推荐用环境变量覆盖：`ADMIN_PASSWORD=你的密码 npm run dev`

## 📁 项目结构

```
anime-blog/
├── app/                  # 页面与 API 路由
│   ├── api/
│   │   ├── posts/        # 文章 CRUD（写操作需登录）
│   │   ├── comments/     # 评论读取与发表
│   │   ├── upload/       # 图片上传（仅管理员）
│   │   ├── files/        # 动态提供上传的图片
│   │   ├── friends/      # 友链读取与提交
│   │   ├── auth/         # 后台登录 / 校验
│   │   └── music/        # 网易云音乐代理（search/detail/songurl）
│   ├── posts/            # 文章列表 + 详情（含 TOC / 评论）
│   ├── search/           # 站内搜索
│   ├── gallery/          # 图片墙
│   ├── friends/          # 友链
│   ├── about/            # 关于
│   ├── admin/            # 后台（列表 + 编辑器）
│   ├── rss.xml/          # RSS 订阅
│   └── sitemap.ts        # 站点地图
├── components/           # 组件（播放器 / 图片墙 / 编辑器 / 评论等）
├── lib/                  # 工具库（存储 / 音乐 / 鉴权 / TOC / 站点配置）
├── data/                 # 文章 / 友链 / 评论 JSON + 上传图片（uploads/，git 忽略）
└── public/wall/          # 图片墙壁纸（换成你自己的图片）
```

## 🛠 自定义站点

所有站点信息都在 **`lib/site.ts`** 里：

| 配置 | 说明 |
| --- | --- |
| `site.name` / `slogan` | 博客名与标语 |
| `site.avatar` | 头像 emoji |
| `site.adminPassword` | 后台密码（建议用环境变量） |
| `gallery` 数组 | 图片墙的图片列表（放 `public/wall/`） |
| `coverGradients` | 文章封面的可选渐变 |

## 📄 写作

1. 打开 `/admin` 登录
2. 点「写新文章」
3. 填写标题、标签、封面（可**上传自己的封面图片**），正文用 Markdown（可上传插图）
4. 保存后自动出现在 `/posts` 网格里

## 🎵 音乐说明

播放器通过服务端代理网易云音乐官方接口（`music.163.com`），无需第三方 Key。
音频版权归各音乐平台所有，请仅用于个人学习与欣赏。
歌曲实际可播性受版权限制，部分歌曲会提示无法播放，属正常现象。

## 🚢 部署提示

- **自建服务器（推荐）**：`npm run build && npm run start`，数据（文章/评论/图片）都存本地，开箱即用。
- **Vercel**：`data/` 是本地文件系统，serverless 平台**写入会丢失**。
  若要在 Vercel 上完整使用（写作/评论/上传），需要把 `lib/store.ts` 的存储换成数据库
  （如 SQLite + Turso，或 Postgres/Upstash）。只读场景（展示文章）可以直接部署。
- 环境变量：
  - `ADMIN_PASSWORD`：后台密码（生产环境必设）
  - `SITE_URL`：站点域名，用于 RSS / sitemap 生成（如 `https://your.site`）
- 若部署在 HTTPS 下，播放器会自动把音频地址升级为 https，避免浏览器混合内容拦截。

## 🗂 备份与迁移

所有内容都在 `data/` 目录：`posts.json`（文章）、`friends.json`（友链）、
`comments.json`（评论）、`uploads/`（上传图片）。备份这个目录即可；换机器时整体拷贝。

## 🧭 常见问题

- **上传的图片 404？** 上传文件经 `/api/files/<name>` 动态提供（不走 public 目录），
  理论上不会 404；如果出现，检查 `data/uploads/` 是否存在该文件。
- **RSS 地址是什么？** `/rss.xml`，可直接填入订阅器；站点地图在 `/sitemap.xml`。
- **后台编辑器是浅色？** 这是刻意的（编辑区固定浅色，避免深色下写作对比度问题）。
