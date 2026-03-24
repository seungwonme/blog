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

interface GeneratedPostsData {
  posts: PostData[];
  digests: PostData[];
  about: string;
  generatedAt: string;
}

const data = postsData as GeneratedPostsData;
const posts: PostData[] = data.posts;
const digests: PostData[] = data.digests;
const aboutContent: string = data.about;

export function getAllPosts(): PostData[] {
  return posts;
}

export function getPostBySlug(slug: string): PostData | null {
  return posts.find((p) => p.slug === slug) ?? null;
}

export function searchPosts(keyword: string): PostData[] {
  const words = keyword
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  if (words.length === 0) return [];

  return posts
    .map((p) => {
      const searchable =
        `${p.title} ${p.description} ${p.content} ${p.tags.join(" ")}`.toLowerCase();
      const score = words.filter((w) => searchable.includes(w)).length;
      return { post: p, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.post);
}

export function getAllDigests(): PostData[] {
  return digests;
}

export function getDigestBySlug(slug: string): PostData | null {
  return digests.find((d) => d.slug === slug) ?? null;
}

export function getAboutContent(): string {
  return aboutContent;
}
