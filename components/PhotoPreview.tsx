import Link from "next/link";
import { getConfig } from "@/lib/store";

/** 首页卡片：图片墙预览（前 4 张拼贴） */
export default async function PhotoPreview() {
  const { gallery } = await getConfig();
  const shots = gallery.slice(0, 4);

  return (
    <section className="home-card glass">
      <div className="home-card-head">
        <h3>🖼️ 图片墙</h3>
        <Link href="/gallery" className="home-card-more">
          全部 →
        </Link>
      </div>
      {shots.length === 0 ? (
        <p className="home-card-empty">还没有壁纸～</p>
      ) : (
        <div className="home-photos">
          {shots.map((it, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={it.src + i}
              src={it.src}
              alt={it.title}
              loading="lazy"
              className={i === 0 ? "big" : ""}
            />
          ))}
        </div>
      )}
    </section>
  );
}
