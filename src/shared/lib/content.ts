import postsData from "@/shared/generated/posts.json";

export interface PostFrontmatter {
  title: string;
  slug: string;
  category: string;
  tags: string[];
  date: string;
  description: string;
}

export interface PostData extends PostFrontmatter {
  content: string;
}

const posts: PostData[] = postsData.posts;
const aboutContent: string = postsData.about;

export function getAllPosts(): PostData[] {
  return posts;
}

export function getPostBySlug(slug: string): PostData | null {
  return posts.find((p) => p.slug === slug) ?? null;
}

export function searchPosts(keyword: string): PostData[] {
  const lower = keyword.toLowerCase();
  return posts.filter(
    (p) =>
      p.title.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower) ||
      p.content.toLowerCase().includes(lower) ||
      p.tags.some((t) => t.toLowerCase().includes(lower)),
  );
}

export function getAboutContent(): string {
  return aboutContent;
}
