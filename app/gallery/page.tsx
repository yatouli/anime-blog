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
          默认是错落的重叠拼贴，点击任意一张展开成网格，再点图片看大图～
          想换自己的图？后台「站点设置 → 图片墙」上传即可。
        </p>
      </header>
      <GalleryWall items={gallery} />
    </>
  );
}
