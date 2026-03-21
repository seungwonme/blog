import {
  getAllPosts,
  getPostBySlug as getPostBySlugFromContent,
  searchPosts as searchPostsFromContent,
} from "@/shared/lib/content";
import type { Post } from "../model/types";

function toPost(data: ReturnType<typeof getAllPosts>[number]): Post {
  return {
    id: data.slug,
    title: data.title,
    slug: data.slug,
    category: data.category,
    tags: data.tags,
    date: data.date,
    description: data.description,
    content: data.content,
    coverUrl: null,
  };
}

export function getPosts(): Post[] {
  return getAllPosts().map(toPost);
}

export function getPostBySlug(slug: string): Post | null {
  const data = getPostBySlugFromContent(slug);
  return data ? toPost(data) : null;
}

export function getPostsByKeyword(keyword: string): Post[] {
  return searchPostsFromContent(keyword).map(toPost);
}
