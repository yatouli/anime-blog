import type { MusicSong } from "./types";

/**
 * 音乐多数据源：
 * - GdStudio 聚合节点（music-api.gdstudio.xyz）：代理网易云，海外可访问；
 *   免费歌曲返回完整音频（完整播放），VIP 歌曲返回空 URL。
 * - 网易云直连（music.163.com）：Vercel 海外服务器下不可用，保留作国内部署时的兜底。
 * - iTunes Search API：全球可用（苹果 CDN），自带 30 秒试听音频，作为最后兜底。
 * 搜索顺序：GdStudio 网易 → iTunes；播放顺序：GdStudio 完整曲 → 网易直连 → iTunes 试听。
 */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const GD = "https://music-api.gdstudio.xyz/api.php";
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
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`netease api ${res.status}`);
  return (await res.json()) as T;
}

async function gdFetch<T>(params: string): Promise<T> {
  const res = await fetch(`${GD}?${params}`, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`gdstudio api ${res.status}`);
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

/* ---------------- GdStudio 网易云源（海外可用的完整曲目） ---------------- */

interface GdSong {
  id?: string;
  name?: string;
  artist?: string[];
  album?: string;
  pic_id?: string;
  url_id?: string;
}

function fromGd(s: GdSong): MusicSong {
  return {
    id: Number(s.id ?? s.url_id ?? 0),
    name: s.name || "未知歌曲",
    artist: (s.artist?.[0] || "未知歌手").split(" ")[0].trim(),
    album: s.album || "未知专辑",
    albumPic: "",
    duration: 0,
    source: "netease",
  };
}

/** GdStudio 网易云搜索；返回含专辑封面的歌曲列表 */
async function gdSearch(keywords: string, limit = 12): Promise<MusicSong[]> {
  const list = await gdFetch<GdSong[]>(
    `types=search&source=netease&name=${encodeURIComponent(keywords)}&count=${limit}`
  );
  if (!Array.isArray(list) || list.length === 0) return [];
  const songs = list.map(fromGd).filter((s) => s.id > 0);

  // 并行补齐专辑封面（单个失败不影响结果）
  await Promise.allSettled(
    songs.map(async (s) => {
      try {
        const pic = await gdFetch<{ url?: string }>(
          `types=pic&source=netease&id=${s.id}`
        );
        if (pic?.url) s.albumPic = pic.url.replace(/^http:\/\//, "https://");
      } catch {
        /* 封面拿不到就用占位 */
      }
    })
  );
  return songs;
}

/** GdStudio 网易云播放地址（免费歌曲返回完整音频，VIP 返回空） */
async function gdSongUrl(id: number): Promise<string> {
  const j = await gdFetch<{ url?: string }>(
    `types=url&source=netease&id=${id}`
  );
  const url = j?.url || "";
  return url ? url.replace(/^http:\/\//, "https://") : "";
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

/**
 * 搜索歌曲：
 * - source = "itunes"：只走 iTunes（用于 VIP 歌曲的试听兜底）
 * - 默认：GdStudio 网易云 → iTunes
 */
export async function searchSongs(
  keywords: string,
  limit = 12,
  source?: string
): Promise<MusicSong[]> {
  if (source === "itunes") {
    return itunesSearch(keywords, limit);
  }
  try {
    const gd = await gdSearch(keywords, limit);
    if (gd.length > 0) return gd;
  } catch {
    /* GdStudio 不可用则走 iTunes */
  }
  return itunesSearch(keywords, limit);
}

/** 批量获取歌曲详情（网易云直连；海外部署下通常不可用） */
export async function songDetail(ids: number[]): Promise<MusicSong[]> {
  if (!ids.length) return [];
  const c = ids.map((id) => `{"id":${id}}`).join(",");
  const data = await neteaseFetch<{ songs?: RawSong[]; code?: number }>(
    `/api/v3/song/detail?c=[${c}]`
  );
  return (data.songs || []).map(normalize);
}

/**
 * 获取网易云可播放音频地址：
 * 1) GdStudio 节点（海外可用，免费歌返回完整曲目）
 * 2) 网易云直连（国内/对网易友好的网络可用）
 * 均失败返回空字符串，由前端决定是否走 iTunes 试听兜底。
 */
export async function songUrl(id: number, br = 320000): Promise<string> {
  try {
    const url = await gdSongUrl(id);
    if (url) return url;
  } catch {
    /* 继续尝试直连 */
  }
  try {
    const data = await neteaseFetch<{
      data?: { url: string | null }[];
      code?: number;
    }>(`/api/song/enhance/player/url?ids=[${id}]&br=${br}`);
    const url = data.data?.[0]?.url || "";
    if (url) return url.replace(/^http:\/\//, "https://");
  } catch {
    /* 直连也失败 */
  }
  return "";
}
