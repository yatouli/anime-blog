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
  views: number; // 阅读量
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
  /** 回复的父评论 id（顶级评论为空） */
  parentId?: string;
  /** 被回复的昵称（渲染时显示 回复 @xx） */
  replyTo?: string;
}

export interface CommentInput {
  postId: string;
  name: string;
  content: string;
  parentId?: string;
  replyTo?: string;
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
  /** 图片墙：默认为内置壁纸，可在后台增删自定义图片 */
  gallery: WallItem[];
  /** 图片墙分类（相册）；为空时页面回退用 gallery 作为单一分类 */
  albums: Album[];
}

export interface MusicSong {
  /** 酷我为 "MUSIC_xxx" 字符串；iTunes 为负数数字 */
  id: number | string;
  name: string;
  artist: string;
  album: string;
  albumPic: string;
  duration: number; // ms
  /** iTunes 源歌曲的试听音频（无需再请求 songurl） */
  previewUrl?: string;
  source?: "netease" | "itunes" | "kuwo";
  /** 列表内唯一键（iTunes 可能有重复 trackId） */
  key?: string;
}

export interface WallItem {
  src: string;
  title: string;
  w: number;
  h: number;
}

/** 图片墙分类（相册）：名称 + 不限数量的图片 */
export interface Album {
  id: string;
  name: string;
  photos: WallItem[];
}
