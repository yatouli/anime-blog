import type { MusicSong } from "./types";

/**
 * 音乐双数据源（针对 Vercel 海外部署的可用性设计）：
 * - 酷我音乐（search.kuwo.cn / antiserver.kuwo.cn）：海外可访问，
 *   免费歌曲返回【完整 mp3】实现完整播放，搜索自带封面/时长。
 * - iTunes Search API：全球可用（苹果 CDN），自带 30 秒试听音频，作为兜底。
 * 网易云直连（music.163.com）在海外 IP 下 weapi 会被静默丢弃，故不再使用。
 */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const KW_REF = "https://www.kuwo.cn/";

/** 简单的 HTML 实体解码（酷我搜索返回 &nbsp; 等实体） */
function decodeHtml(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/* ---------------- 酷我源（完整播放） ---------------- */

interface KuwoRaw {
  abslist?: {
    MUSICRID?: string;
    SONGNAME?: string;
    ARTIST?: string;
    ALBUM?: string;
    DURATION?: string;
    web_albumpic_short?: string;
    web_artistpic_short?: string;
    payInfo?: { cannotOnlinePlay?: string };
  }[];
}

/** 酷我搜索；返回含完整播放地址的歌曲列表（优先原版，剔除 DJ/翻唱等杂项） */
async function kuwoSearch(keywords: string, limit = 12): Promise<MusicSong[]> {
  const res = await fetch(
    `https://search.kuwo.cn/r.s?all=${encodeURIComponent(
      keywords
    )}&ft=music&itemset=web_2013&pn=0&rn=${limit * 3}&rformat=json&encoding=utf8`,
    { headers: { "User-Agent": UA, Referer: KW_REF }, signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) throw new Error(`kuwo search ${res.status}`);
  const text = await res.text();
  // 酷我返回 Python 风格单引号 JSON，转成标准 JSON 解析
  const j = JSON.parse(text.replace(/'/g, '"')) as KuwoRaw;
  const BAD = /KTV|伴奏|铃声|DJ|纯音乐|Remix|混音|Live|现场|演唱会|翻唱|完整版|慢摇|串烧/i;
  const items = (j.abslist || [])
    .filter((s) => s.MUSICRID && s.SONGNAME)
    .filter((s) => s.payInfo?.cannotOnlinePlay !== "1")
    .filter((s) => !BAD.test(s.SONGNAME || ""));
  // 无括号的原版名称排前面
  const plain = items.filter((s) => !/[（(]/.test(s.SONGNAME || ""));
  const rest = items.filter((s) => /[（(]/.test(s.SONGNAME || ""));
  return [...plain, ...rest]
    .slice(0, limit)
    .map((s) => ({
      id: s.MUSICRID as string,
      name: decodeHtml(s.SONGNAME || ""),
      artist: decodeHtml(s.ARTIST || "未知歌手"),
      album: decodeHtml(s.ALBUM || "未知专辑"),
      albumPic: (s.web_albumpic_short || "").replace("{size}", "300"),
      duration: (Number(s.DURATION) || 0) * 1000,
      source: "kuwo",
    }));
}

/** 酷我播放地址（免费歌曲返回完整 mp3；受限歌曲返回试听或空） */
async function kuwoUrl(rid: string): Promise<string> {
  const res = await fetch(
    `https://antiserver.kuwo.cn/anti.s?type=convert_url3&rid=${encodeURIComponent(
      rid
    )}&format=mp3&response=url`,
    { headers: { "User-Agent": UA, Referer: KW_REF }, signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) throw new Error(`kuwo url ${res.status}`);
  const j = (await res.json()) as { code?: number; url?: string };
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
    id: -Math.abs(r.trackId), // 负数 id 标记为 iTunes 源，避免与酷我 id 冲突
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
 * - source = "itunes"：只走 iTunes（用于 VIP/受限歌曲的试听兜底）
 * - 默认：酷我音乐 → iTunes
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
    const kw = await kuwoSearch(keywords, limit);
    if (kw.length > 0) return kw;
  } catch {
    /* 酷我不可用则走 iTunes */
  }
  return itunesSearch(keywords, limit);
}

/**
 * 获取可播放音频地址：
 * - 字符串 id：酷我 MUSIC_xxx，返回完整 mp3（受限歌曲可能返回试听或空）
 * - 数字 id：历史网易云 id，海外不可用，直接返回空（由前端走 iTunes 兜底）
 */
export async function songUrl(id: number | string): Promise<string> {
  if (typeof id === "string" && id.startsWith("MUSIC_")) {
    try {
      const url = await kuwoUrl(id);
      if (url) return url;
    } catch {
      /* 酷我失败，返回空走前端兜底 */
    }
  }
  return "";
}
