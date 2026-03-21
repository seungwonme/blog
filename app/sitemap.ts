import type { MetadataRoute } from "next";
import { getPosts } from "@/entities/post";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://seunan.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts();

  const postRoutes = posts.map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}`,
    lastModified: post.date,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    ...postRoutes,
  ];
}
