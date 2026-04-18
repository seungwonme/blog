import {
  getAllDigests,
  getAllPosts,
  getDigestBySlug as getDigestBySlugFromContent,
  getPostBySlug as getPostBySlugFromContent,
} from "@/shared/lib/content";
import type { Post } from "../model/types";

function toPost(data: ReturnType<typeof getAllPosts>[number]): Post {
  return {
    title: data.title,
    slug: data.slug,
    category: data.category,
    tags: data.tags,
    date: data.date,
    description: data.description,
    content: data.content,
  };
}

export function getPosts(): Post[] {
  return getAllPosts().map(toPost);
}

export function getPostBySlug(slug: string): Post | null {
  const data = getPostBySlugFromContent(slug);
  return data ? toPost(data) : null;
}

export function getDigests(): Post[] {
  return getAllDigests().map(toPost);
}

export function getDigestBySlug(slug: string): Post | null {
  const data = getDigestBySlugFromContent(slug);
  return data ? toPost(data) : null;
}

export function getAllEntries(): Post[] {
  return [...getPosts(), ...getDigests()].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}

export function getEntryBySlug(slug: string): Post | null {
  return getPostBySlug(slug) ?? getDigestBySlug(slug);
}
