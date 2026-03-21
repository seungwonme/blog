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

  // Use the most recent post date as lastModified for homepage
  const latestPostDate =
    posts.length > 0
      ? posts.reduce((latest, post) =>
          post.date > latest.date ? post : latest,
        ).date
      : new Date().toISOString();

  return [
    {
      url: SITE_URL,
      lastModified: latestPostDate,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: latestPostDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    ...postRoutes,
  ];
}
