import type { Metadata } from "next";
import GalleryWall from "@/components/GalleryWall";
import { gallery } from "@/lib/site";

export const metadata: Metadata = { title: "图片墙" };

export default function GalleryPage() {
  return (
    <>
      <header className="page-head">
        <h1>🖼️ 图片墙</h1>
        <p>
          默认是错落的重叠拼贴，点击任意一张展开成网格，再点图片看大图～
        </p>
      </header>
      <GalleryWall items={gallery} />
    </>
  );
}
