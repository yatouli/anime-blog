import type { Metadata } from "next";
import FriendCard from "@/components/FriendCard";
import FriendForm from "@/components/FriendForm";
import { getFriends } from "@/lib/store";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "友链" };

export default function FriendsPage() {
  const friends = getFriends();

  return (
    <>
      <header className="page-head">
        <h1>🤝 友链</h1>
        <p>交换友链，一起把互联网变得更有温度。</p>
      </header>

      <div className="friends-layout">
        <div className="friends-grid">
          {friends.map((f) => (
            <FriendCard key={f.id} friend={f} />
          ))}
          {friends.length === 0 && (
            <div className="empty glass">还没有友链，快来申请第一个吧～</div>
          )}
        </div>

        <div className="friends-side">
          <div className="friend-rules glass">
            <h3>📌 友链须知</h3>
            <ul>
              {site.friendRules.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
          <FriendForm />
        </div>
      </div>
    </>
  );
}
