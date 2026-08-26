import type { Metadata } from "next";
import GalleryWall from "@/components/GalleryWall";
import { getConfig } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "图片墙" };

export default async function GalleryPage() {
  const { gallery } = await getConfig();

  return (
    <>
      <header className="page-head">
        <h1>🖼️ 图片墙</h1>
        <p>
          壁纸自动归档成相册，点击相册展开看照片，再点照片看大图～
          想传新壁纸？后台「站点设置 → 图片墙」上传即可。
        </p>
      </header>
      <GalleryWall items={gallery} />
    </>
  );
}
