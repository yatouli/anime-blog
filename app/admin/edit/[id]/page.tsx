import type { Metadata } from "next";
import PostEditor from "@/components/PostEditor";

export const metadata: Metadata = { title: "编辑文章" };

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PostEditor postId={id} />;
}
