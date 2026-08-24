"use client";

import type { Friend } from "@/lib/types";

export default function FriendCard({ friend }: { friend: Friend }) {
  return (
    <a
      href={friend.url}
      target="_blank"
      rel="noopener noreferrer"
      className="friend-card glass"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={friend.avatar}
        alt={friend.name}
        className="friend-avatar"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            "https://api.dicebear.com/7.x/thumbs/svg?seed=fallback";
        }}
      />
      <div className="friend-info">
        <div className="friend-name">{friend.name}</div>
        <div className="friend-desc">{friend.desc}</div>
      </div>
    </a>
  );
}
