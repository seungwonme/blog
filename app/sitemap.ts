import type { MetadataRoute } from "next";
import { getAllEntries, getCategories } from "@/entities/post";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.aidenahn.com";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function sitemap(): MetadataRoute.Sitemap {
  const entries = getAllEntries();
  const now = Date.now();

  const entryRoutes = entries.map((entry) => {
    const isDigest = entry.category === "digest";
    const entryDate = new Date(`${entry.updated || entry.date}T00:00:00Z`);
    const isRecent = now - entryDate.getTime() < SEVEN_DAYS_MS;

    return {
      url: `${SITE_URL}/${entry.category}/${entry.slug}`,
      lastModified: entryDate,
      changeFrequency: isDigest
        ? isRecent
          ? ("daily" as const)
          : ("never" as const)
        : ("monthly" as const),
      priority: isDigest ? 0.5 : 0.8,
    };
  });

  const latestDate =
    entries.length > 0 ? new Date(`${entries[0].date}T00:00:00Z`) : new Date();

  // 카테고리별 최신일 — 카테고리 목록 페이지의 lastModified를 전역 최신일이
  // 아니라 해당 카테고리 글 중 가장 최근 날짜로 채운다(크롤러 신뢰도).
  const categoryLatest = new Map<string, number>();
  for (const entry of entries) {
    const cat = entry.category.toLowerCase();
    const t = new Date(`${entry.updated || entry.date}T00:00:00Z`).getTime();
    const cur = categoryLatest.get(cat);
    if (cur === undefined || t > cur) categoryLatest.set(cat, t);
  }

  const categoryRoutes = getCategories().map((category) => ({
    url: `${SITE_URL}/${category}`,
    lastModified: new Date(
      categoryLatest.get(category) ?? latestDate.getTime(),
    ),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: latestDate,
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: latestDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    ...categoryRoutes,
    ...entryRoutes,
  ];
}
