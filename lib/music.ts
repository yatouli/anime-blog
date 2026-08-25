import type { MusicSong } from "./types";

/**
 * 音乐双数据源：
 * - 网易云（music.163.com）：仅在国内/对网易友好的网络可用（Vercel 海外服务器会返回空结果）
 * - iTunes Search API：全球可用（苹果 CDN），自带 30 秒试听音频
 * 搜索时优先网易，结果为空/失败时自动回退 iTunes。
 */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const REF = "https://music.163.com";
const BASE = "https://music.163.com";

async function neteaseFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "User-Agent": UA,
      Referer: REF,
      Cookie: "os=pc",
      "Accept-Language": "zh-CN,zh;q=0.9",
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`netease api ${res.status}`);
  return (await res.json()) as T;
}

interface RawSong {
  id: number;
  name: string;
  ar?: { name: string }[];
  al?: { name: string; picUrl?: string };
  artists?: { name: string }[];
  album?: { name: string; picUrl?: string };
  dt?: number;
  duration?: number;
}

function normalize(s: RawSong): MusicSong {
  const artist = (s.ar?.[0]?.name || s.artists?.[0]?.name || "未知歌手")
    .split(" ")[0]
    .trim();
  const album = s.al?.name || s.album?.name || "未知专辑";
  const albumPic =
    (s.al?.picUrl || s.album?.picUrl || "").replace(/^http:\/\//, "https://") || "";
  const duration = s.dt ?? s.duration ?? 0;
  return { id: s.id, name: s.name, artist, album, albumPic, duration };
}

/* ---------------- iTunes 源 ---------------- */

interface ItunesResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackTimeMillis?: number;
}

function fromItunes(r: ItunesResult, idx: number): MusicSong {
  return {
    id: -Math.abs(r.trackId), // 负数 id 标记为 iTunes 源，避免与网易 id 冲突
    name: r.trackName || "未知歌曲",
    artist: r.artistName || "未知歌手",
    album: r.collectionName || "未知专辑",
    albumPic: (r.artworkUrl100 || "").replace("100x100", "300x300"),
    duration: r.trackTimeMillis ?? 0,
    previewUrl: r.previewUrl || undefined,
    source: "itunes",
    key: `${r.trackId}-${idx}`,
  };
}

async function itunesSearch(keywords: string, limit = 12): Promise<MusicSong[]> {
  const res = await fetch(
    `https://itunes.apple.com/search?media=music&term=${encodeURIComponent(
      keywords
    )}&limit=${limit}&country=CN`,
    { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(12000) }
  );
  if (!res.ok) throw new Error(`itunes api ${res.status}`);
  const j = (await res.json()) as { results?: ItunesResult[] };
  return (j.results || []).map((r, i) => fromItunes(r, i));
}

/* ---------------- 对外接口 ---------------- */

/** 搜索歌曲：优先网易云，失败或为空时回退 iTunes */
export async function searchSongs(keywords: string, limit = 12): Promise<MusicSong[]> {
  try {
    const netease = await neteaseFetch<{
      result?: { songs?: RawSong[] };
      code?: number;
    }>(`/api/search/get/web?s=${encodeURIComponent(keywords)}&type=1&limit=${limit}`);
    const songs = (netease.result?.songs || []).map(normalize);
    if (songs.length > 0) return songs;
  } catch {
    /* 网易不可用则走 iTunes */
  }
  return itunesSearch(keywords, limit);
}

/** 批量获取歌曲详情（网易云） */
export async function songDetail(ids: number[]): Promise<MusicSong[]> {
  if (!ids.length) return [];
  const c = ids.map((id) => `{"id":${id}}`).join(",");
  const data = await neteaseFetch<{ songs?: RawSong[]; code?: number }>(
    `/api/v3/song/detail?c=[${c}]`
  );
  return (data.songs || []).map(normalize);
}

/** 获取网易云可播放音频地址；若为 http 则升级为 https */
export async function songUrl(id: number, br = 320000): Promise<string> {
  const data = await neteaseFetch<{
    data?: { url: string | null }[];
    code?: number;
  }>(`/api/song/enhance/player/url?ids=[${id}]&br=${br}`);
  const url = data.data?.[0]?.url || "";
  if (!url) return "";
  return url.replace(/^http:\/\//, "https://");
}
