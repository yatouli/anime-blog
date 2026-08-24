import { NextResponse } from "next/server";
import { addFriend, getFriends } from "@/lib/store";
import type { FriendInput } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ friends: getFriends() });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<FriendInput>;
  if (!body.name?.trim() || !body.url?.trim()) {
    return NextResponse.json({ error: "名称和网址不能为空" }, { status: 400 });
  }
  const friend = addFriend({
    name: body.name,
    url: body.url,
    avatar: body.avatar,
    desc: body.desc,
  });
  return NextResponse.json({ friend }, { status: 201 });
}
