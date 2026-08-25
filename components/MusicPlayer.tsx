"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MusicSong } from "@/lib/types";

function fmt(ms: number): string {
  if (!ms || ms <= 0) return "00:00";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<MusicSong[]>([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [drawer, setDrawer] = useState<"none" | "queue" | "search">("none");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<MusicSong[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const seekRef = useRef<{ dragging: boolean }>({ dragging: false });

  // 播放状态同步到 <body>：背景光斑随音乐脉动
  useEffect(() => {
    document.body.classList.toggle("music-playing", playing);
    return () => document.body.classList.remove("music-playing");
  }, [playing]);

  const current = index >= 0 ? queue[index] : null;

  const loadAndPlay = useCallback(async (song: MusicSong) => {
    try {
      // iTunes 源歌曲自带试听音频，直接播放；网易云源需请求 songurl
      let url = song.previewUrl;
      if (!url) {
        const res = await fetch(`/api/music/songurl?id=${song.id}`);
        const data = await res.json();
        url = data?.url as string | undefined;
      }
      if (!url) {
        setError("这首歌暂时无法播放（可能受版权限制）");
        return;
      }
      setError("");
      const audio = audioRef.current;
      if (!audio) return;
      audio.src = url;
      setDuration(0);
      setTime(0);
      await audio.play();
      setPlaying(true);
    } catch {
      setError("播放失败，请稍后重试");
    }
  }, []);

  // 切换歌曲
  useEffect(() => {
    if (current) {
      void loadAndPlay(current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const playAt = (i: number) => {
    if (i < 0 || i >= queue.length) return;
    setIndex(i);
  };

  const playSong = (song: MusicSong) => {
    const i = queue.length;
    setQueue((q) => [...q, song]);
    setIndex(i);
    setDrawer("none");
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!current) return;
    if (audio.paused) {
      void audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const next = () => {
    if (queue.length === 0) return;
    setIndex((index + 1) % queue.length);
  };

  const prev = () => {
    if (queue.length === 0) return;
    setIndex((index - 1 + queue.length) % queue.length);
  };

  const removeAt = (i: number) => {
    setQueue((q) => {
      const nq = q.filter((_, j) => j !== i);
      if (i < index) setIndex((x) => x - 1);
      else if (i === index) {
        if (nq.length === 0) {
          const audio = audioRef.current;
          if (audio) {
            audio.pause();
            audio.src = "";
          }
          setPlaying(false);
          setIndex(-1);
          setTime(0);
          setDuration(0);
        } else {
          setIndex(Math.min(index, nq.length - 1));
        }
      }
      return nq;
    });
  };

  const doSearch = async (k: string) => {
    if (!k.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch(
        `/api/music/search?keywords=${encodeURIComponent(k.trim())}&limit=12`
      );
      const data = await res.json();
      setResults(Array.isArray(data.songs) ? data.songs : []);
    } catch {
      setError("搜索失败，请稍后重试");
    } finally {
      setSearching(false);
    }
  };

  // 进度条 seek
  const seek = (clientX: number, bar: HTMLDivElement) => {
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const audio = audioRef.current;
    if (audio && duration > 0) {
      audio.currentTime = ratio * duration;
    }
  };

  const onSeekPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    seekRef.current.dragging = true;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    seek(e.clientX, e.currentTarget);
  };
  const onSeekPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!seekRef.current.dragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setSeekPreview(ratio * duration);
    seek(e.clientX, e.currentTarget);
  };
  const onSeekPointerUp = () => {
    seekRef.current.dragging = false;
    setSeekPreview(null);
  };

  const progressRatio =
    duration > 0
      ? (seekPreview !== null ? seekPreview : time) / duration
      : 0;

  const cover = current?.albumPic || "";
  const barWidth = `${(progressRatio * 100).toFixed(2)}%`;

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onDurationChange={(e) =>
          setDuration(e.currentTarget.duration || 0)
        }
        onEnded={next}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => {
          setError("音频加载失败（可能是版权限制或网络问题）");
          setPlaying(false);
        }}
      />

      <div
        className={`music-player glass ${current ? "" : "empty"} ${playing ? "playing" : ""}`}
      >
        {/* 封面 */}
        <div className="mp-cover">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              className={playing ? "spinning" : ""}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span className="mp-cover-fallback">🎵</span>
          )}
        </div>

        {/* 律动均衡条（播放时跳动） */}
        <div className="mp-eq" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </div>

        {/* 信息 */}
        <div className="mp-info">
          <div className="mp-title">{current?.name ?? "未在播放"}</div>
          <div className="mp-artist">
            {current ? `${current.artist} · ${current.album}` : "去搜索一首歌吧"}
          </div>
        </div>

        {/* 控制 */}
        <div className="mp-controls">
          <button className="mp-btn" onClick={prev} title="上一首">
            ⏮
          </button>
          <button className="mp-btn mp-play" onClick={togglePlay} title="播放/暂停">
            {playing ? "⏸" : "▶"}
          </button>
          <button className="mp-btn" onClick={next} title="下一首">
            ⏭
          </button>
        </div>

        {/* 进度 */}
        <div className="mp-progress">
          <span className="mp-time">{fmt(time * 1000)}</span>
          <div
            className="mp-bar"
            onPointerDown={onSeekPointerDown}
            onPointerMove={onSeekPointerMove}
            onPointerUp={onSeekPointerUp}
          >
            <div className="mp-bar-fill" style={{ width: barWidth }} />
          </div>
          <span className="mp-time">{fmt(duration * 1000)}</span>
        </div>

        {/* 音量 */}
        <div className="mp-volume">
          <span title="音量">🔊</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              if (audioRef.current) audioRef.current.volume = v;
            }}
            style={{ ["--vol" as string]: `${volume * 100}%` }}
          />
        </div>

        {/* 队列 / 搜索按钮 */}
        <div className="mp-actions">
          <button
            className={`mp-btn ${drawer === "queue" ? "on" : ""}`}
            onClick={() => setDrawer(drawer === "queue" ? "none" : "queue")}
            title="播放队列"
          >
            📃
          </button>
          <button
            className={`mp-btn ${drawer === "search" ? "on" : ""}`}
            onClick={() => setDrawer(drawer === "search" ? "none" : "search")}
            title="搜索歌曲"
          >
            🔍
          </button>
        </div>

        {/* 抽屉 */}
        {drawer !== "none" && (
          <div className="mp-drawer">
            {drawer === "search" ? (
              <div className="mp-search">
                <div className="mp-search-bar">
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void doSearch(keyword);
                    }}
                    placeholder="输入歌名 / 歌手，如：周杰伦"
                  />
                  <button onClick={() => void doSearch(keyword)} disabled={searching}>
                    {searching ? "…" : "搜索"}
                  </button>
                </div>
                {error && <div className="mp-error">{error}</div>}
                <ul className="mp-songs">
                  {results.map((s) => (
                    <li key={s.id} onClick={() => playSong(s)}>
                      {s.albumPic ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.albumPic} alt="" />
                      ) : (
                        <span className="mp-song-fallback">🎵</span>
                      )}
                      <div className="mp-song-info">
                        <div className="mp-song-name">{s.name}</div>
                        <div className="mp-song-artist">
                          {s.artist} · {s.album}
                        </div>
                      </div>
                      <span className="mp-song-dur">{fmt(s.duration)}</span>
                    </li>
                  ))}
                  {!searching && results.length === 0 && (
                    <li className="mp-empty">
                      {keyword ? "没有搜到结果，换个关键词试试？" : "输入关键词开始搜索"}
                    </li>
                  )}
                </ul>
              </div>
            ) : (
              <div className="mp-queue">
                <div className="mp-queue-head">
                  播放队列（{queue.length}）
                  {queue.length > 0 && (
                    <button
                      onClick={() => {
                        setQueue([]);
                        setIndex(-1);
                        setPlaying(false);
                        const a = audioRef.current;
                        if (a) {
                          a.pause();
                          a.src = "";
                        }
                      }}
                    >
                      清空
                    </button>
                  )}
                </div>
                <ul className="mp-songs">
                  {queue.map((s, i) => (
                    <li
                      key={`${s.id}-${i}`}
                      className={i === index ? "current" : ""}
                      onClick={() => playAt(i)}
                    >
                      {s.albumPic ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.albumPic} alt="" />
                      ) : (
                        <span className="mp-song-fallback">🎵</span>
                      )}
                      <div className="mp-song-info">
                        <div className="mp-song-name">{s.name}</div>
                        <div className="mp-song-artist">
                          {s.artist} · {s.album}
                        </div>
                      </div>
                      <button
                        className="mp-song-del"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAt(i);
                        }}
                        title="移出队列"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                  {queue.length === 0 && (
                    <li className="mp-empty">队列空空如也，去搜索加一首吧～</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
