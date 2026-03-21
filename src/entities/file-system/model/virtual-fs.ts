import type { Post } from "@/entities/post";

export interface VirtualFS {
  currentPath: string;
  directories: string[];
  files: Map<string, Post[]>;
}

export function buildFileSystem(posts: Post[]): VirtualFS {
  const categoryMap = new Map<string, Post[]>();

  for (const post of posts) {
    const cat = post.category.toLowerCase();
    const existing = categoryMap.get(cat);
    if (existing) {
      existing.push(post);
    } else {
      categoryMap.set(cat, [post]);
    }
  }

  return {
    currentPath: "~",
    directories: Array.from(categoryMap.keys()).sort(),
    files: categoryMap,
  };
}

export function resolvePath(currentPath: string, target: string): string {
  if (target === "~" || target === "/") return "~";
  if (target === "..") {
    if (currentPath === "~") return "~";
    return "~";
  }
  if (target.startsWith("~/")) return target;
  if (currentPath === "~") return `~/${target}`;
  return `${currentPath}/${target}`;
}

export function getPathSegments(path: string): string[] {
  if (path === "~") return [];
  return path.replace("~/", "").split("/");
}

export function formatPrompt(currentPath: string): string {
  return `visitor@seunan.dev:${currentPath}$`;
}
