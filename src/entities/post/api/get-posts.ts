import "server-only";
import type { Post, PostMeta } from "../model/types";
import {
  getAboutContent as getAboutFromSource,
  getAllDigests,
  getAllPosts,
  getDigestBySlug as getDigestBySlugFromSource,
  getPostBySlug as getPostBySlugFromSource,
  searchPosts as searchPostsFromSource,
} from "./content-source";

type SourceData = ReturnType<typeof getAllPosts>[number];

function toPost(data: SourceData): Post {
  return {
    title: data.title,
    slug: data.slug,
    category: data.category,
    tags: data.tags,
    date: data.date,
    updated: data.updated,
    description: data.description,
    content: data.content,
  };
}

function toPostMeta(data: SourceData): PostMeta {
  return {
    title: data.title,
    slug: data.slug,
    category: data.category,
    tags: data.tags,
    date: data.date,
    updated: data.updated,
    description: data.description,
  };
}

function getPosts(): Post[] {
  return getAllPosts().map(toPost);
}

export function getPostBySlug(slug: string): Post | null {
  const data = getPostBySlugFromSource(slug);
  return data ? toPost(data) : null;
}

function getDigests(): Post[] {
  return getAllDigests().map(toPost);
}

function getDigestBySlug(slug: string): Post | null {
  const data = getDigestBySlugFromSource(slug);
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

export function getEntryByCategoryAndSlug(
  category: string,
  slug: string,
): Post | null {
  const cat = category.toLowerCase();
  return (
    getAllEntries().find(
      (e) => e.category.toLowerCase() === cat && e.slug === slug,
    ) ?? null
  );
}

export function getCategories(): string[] {
  return Array.from(
    new Set(getAllEntries().map((e) => e.category.toLowerCase())),
  ).sort();
}

export function getEntriesByCategoryMeta(category: string): PostMeta[] {
  const cat = category.toLowerCase();
  return getAllEntriesMeta().filter((e) => e.category.toLowerCase() === cat);
}

export function getAllEntriesMeta(): PostMeta[] {
  const posts = getAllPosts().map(toPostMeta);
  const digests = getAllDigests().map(toPostMeta);
  return [...posts, ...digests].sort((a, b) => b.date.localeCompare(a.date));
}

export function getAboutContent(): string {
  return getAboutFromSource();
}

export function searchPosts(keyword: string): Post[] {
  return searchPostsFromSource(keyword).map(toPost);
}
