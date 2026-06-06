export interface PostMeta {
  title: string;
  slug: string;
  category: string;
  tags: string[];
  date: string;
  /** 최종 수정일 (frontmatter `updated`, 없으면 미설정 → dateModified는 date로 fallback) */
  updated?: string;
  description: string;
}

export interface Post extends PostMeta {
  content: string;
}
