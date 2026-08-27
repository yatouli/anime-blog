import type { WallItem } from "./types";

/** 站点全局配置：想改博客名称、简介、头像等，改这里即可 */
export const site = {
  name: "星野の小窝",
  shortName: "星野",
  slogan: "在代码与二次元之间，收藏每一个心动瞬间",
  description: "一个二次元风格的毛玻璃博客：写文章、听音乐、晒壁纸、交朋友。",
  /** 站点绝对地址（用于 SEO 分享卡片 / sitemap / RSS） */
  url: "https://blog.xiaogao.dpdns.org",
  avatar: "🌸",
  author: "星野酱",
  email: "3996961083@qq.com",
  github: "https://github.com/",
  bilibili: "https://space.bilibili.com/",
  /** QQ 号（填了就在首页显示 QQ 图标；tencent://message 唤起） */
  qq: "3996961083@qq.com",
  /** 微信号（填了就在首页显示微信图标；可留空） */
  wechat: "",
  since: 2024,
  // 后台登录密码（部署时建议用环境变量 ADMIN_PASSWORD 覆盖）
  adminPassword: "anime2024",
  // 友链申请须知
  friendRules: [
    "本站主打开二次元 / 技术 / 生活分享",
    "请先添加本站为友链，再提交申请",
    "网站需能正常访问，且没有违规内容",
    "申请后 48 小时内会通过邮件或留言告知结果",
  ],
} as const;

/** 图片墙：src 指向 public/wall/ 下的文件，也可换成你自己的图片 */
export const gallery: WallItem[] = [
  { src: "/wall/wall-0.svg", title: "月色星空", w: 3, h: 4 },
  { src: "/wall/wall-1.svg", title: "樱花雨", w: 4, h: 3 },
  { src: "/wall/wall-2.svg", title: "暮色之城", w: 3, h: 3 },
  { src: "/wall/wall-3.svg", title: "深海梦境", w: 4, h: 3 },
  { src: "/wall/wall-4.svg", title: "朝阳", w: 3, h: 4 },
  { src: "/wall/wall-5.svg", title: "极光之夜", w: 4, h: 3 },
  { src: "/wall/wall-6.svg", title: "糖果云", w: 3, h: 3 },
  { src: "/wall/wall-7.svg", title: "星轨", w: 4, h: 4 },
];

/** 默认封面渐变（后台编辑器可选） */
export const coverGradients = [
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
  "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
];
