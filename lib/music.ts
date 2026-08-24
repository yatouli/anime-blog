import type { MusicSong } from "./types";

/**
 * 网易云音乐官方接口代理（服务端调用，绕开浏览器跨域限制）。
 * 实测：/api/search/get/web、/api/song/enhance/player/url、/api/v3/song/detail
 * 在带 UA + Referer + os=pc Cookie 时可直接访问。
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
    (s.al?.picUrl || s.album?.picUrl || "").replace(/^http:\/\//, "https://") ||
    "";
  const duration = s.dt ?? s.duration ?? 0;
  return { id: s.id, name: s.name, artist, album, albumPic, duration };
}

/** 搜索歌曲，返回规范化列表 */
export async function searchSongs(keywords: string, limit = 12): Promise<MusicSong[]> {
  const data = await neteaseFetch<{
    result?: { songs?: RawSong[] };
    code?: number;
  }>(
    `/api/search/get/web?s=${encodeURIComponent(keywords)}&type=1&limit=${limit}`
  );
  return (data.result?.songs || []).map(normalize);
}

/** 批量获取歌曲详情（含封面、时长），用于补齐搜索结果信息 */
export async function songDetail(ids: number[]): Promise<MusicSong[]> {
  if (!ids.length) return [];
  const c = ids.map((id) => `{"id":${id}}`).join(",");
  const data = await neteaseFetch<{ songs?: RawSong[]; code?: number }>(
    `/api/v3/song/detail?c=[${c}]`
  );
  return (data.songs || []).map(normalize);
}

/** 获取可播放的音频地址；若为 http 则尽量升级为 https 避免浏览器混合内容拦截 */
export async function songUrl(id: number, br = 320000): Promise<string> {
  const data = await neteaseFetch<{
    data?: { url: string | null }[];
    code?: number;
  }>(`/api/song/enhance/player/url?ids=[${id}]&br=${br}`);
  const url = data.data?.[0]?.url || "";
  if (!url) return "";
  return url.replace(/^http:\/\//, "https://");
}
