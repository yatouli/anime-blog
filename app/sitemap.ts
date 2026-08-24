import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/store";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/posts`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/gallery`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/friends`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/posts/${p.slug}`,
    lastModified: new Date(`${p.date}T00:00:00+08:00`),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...postPages];
}
