import type { Metadata } from "next";
import GalleryWall from "@/components/GalleryWall";
import { getConfig } from "@/lib/store";
import type { Album } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "图片墙" };

/** 取分类：优先 albums；为空时用 gallery 作为单一分类（兼容旧数据） */
function resolveAlbums(albums: Album[], gallery: Album["photos"]): Album[] {
  if (albums.length > 0) return albums;
  if (gallery.length > 0) {
    return [{ id: "default", name: "全部壁纸", photos: gallery }];
  }
  return [];
}

export default async function GalleryPage() {
  const { albums, gallery } = await getConfig();
  const resolved = resolveAlbums(albums, gallery);

  return (
    <>
      <header className="page-head">
        <h1>🖼️ 图片墙</h1>
        <p>
          壁纸按分类归档成相册，点击相册展开看照片，再点照片看大图～
          后台「站点设置 → 图片墙」可以自定义分类。
        </p>
      </header>
      <GalleryWall albums={resolved} />
    </>
  );
}
