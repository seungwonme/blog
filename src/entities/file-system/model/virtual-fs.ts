// FSD: 같은 레이어의 다른 슬라이스(entities/post)에 결합하지 않기 위해
// 구조적 최소 타입으로 선언. PostMeta 등이 이 shape를 만족하면 그대로 전달 가능.
export interface FileSystemEntry {
  slug: string;
  title: string;
  category: string;
}

export interface VirtualFS<T extends FileSystemEntry = FileSystemEntry> {
  currentPath: string;
  directories: string[];
  files: Map<string, T[]>;
}

export function buildFileSystem<T extends FileSystemEntry>(
  entries: T[],
): VirtualFS<T> {
  const categoryMap = new Map<string, T[]>();

  for (const entry of entries) {
    const cat = entry.category.toLowerCase();
    const existing = categoryMap.get(cat);
    if (existing) {
      existing.push(entry);
    } else {
      categoryMap.set(cat, [entry]);
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
