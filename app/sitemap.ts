import type { MetadataRoute } from "next";
import { getAllEntries } from "@/entities/post";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://seunan.dev";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function sitemap(): MetadataRoute.Sitemap {
  const entries = getAllEntries();
  const now = Date.now();

  const entryRoutes = entries.map((entry) => {
    const isDigest = entry.category === "digest";
    const entryDate = new Date(`${entry.date}T00:00:00Z`);
    const isRecent = now - entryDate.getTime() < SEVEN_DAYS_MS;

    return {
      url: `${SITE_URL}/posts/${entry.slug}`,
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
      priority: 0.9,
    },
    ...entryRoutes,
  ];
}
