import Link from "next/link";
import { getFriends } from "@/lib/store";

/** 首页卡片：友链预览（前 6 个头像排） */
export default async function FriendsPreview() {
  const friends = await getFriends();
  const shots = friends.slice(0, 6);

  return (
    <section className="home-card glass">
      <div className="home-card-head">
        <h3>🤝 友链</h3>
        <Link href="/friends" className="home-card-more">
          申请友链 →
        </Link>
      </div>
      {shots.length === 0 ? (
        <p className="home-card-empty">还没有友链～</p>
      ) : (
        <div className="home-friends">
          {shots.map((f) => (
            <a
              key={f.id}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="home-friend"
              title={f.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.avatar} alt={f.name} loading="lazy" />
              <span>{f.name}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
