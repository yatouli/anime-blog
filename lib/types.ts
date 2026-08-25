export interface Post {
  id: string;
  slug: string;
  title: string;
  tags: string[];
  date: string; // YYYY-MM-DD
  coverEmoji: string;
  coverGradient: string; // css gradient value
  coverImage?: string; // 上传的自定义封面图片
  excerpt: string;
  content: string; // markdown
}

export interface PostInput {
  slug?: string;
  title: string;
  tags?: string[];
  date?: string;
  coverEmoji?: string;
  coverGradient?: string;
  coverImage?: string;
  excerpt?: string;
  content: string;
}

export interface Friend {
  id: string;
  name: string;
  url: string;
  avatar: string;
  desc: string;
  createdAt: string;
}

export interface FriendInput {
  name: string;
  url: string;
  avatar?: string;
  desc?: string;
}

export interface Comment {
  id: string;
  postId: string;
  name: string;
  content: string;
  createdAt: string;
}

export interface CommentInput {
  postId: string;
  name: string;
  content: string;
}

export interface SiteConfig {
  /** 背景类型：gradient 渐变 / image 图片 */
  backgroundType: "gradient" | "image";
  /** 渐变背景（空字符串表示跟随主题默认） */
  gradient: string;
  /** 背景图片 URL（如 /api/files/xxx） */
  image: string;
  /** 背景图片模糊程度（px，0-40） */
  blur: number;
  /** 背景压暗程度（0-0.8，提升文字可读性） */
  overlay: number;
  /** 自定义头像图片 URL（空字符串表示使用 lib/site.ts 的 emoji 头像） */
  avatar: string;
}

export interface MusicSong {
  id: number;
  name: string;
  artist: string;
  album: string;
  albumPic: string;
  duration: number; // ms
}

export interface WallItem {
  src: string;
  title: string;
  w: number;
  h: number;
}
