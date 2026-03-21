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

export function getAboutContent(): string {
  return aboutContent;
}
