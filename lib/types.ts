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
