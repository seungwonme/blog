export interface PostMeta {
  title: string;
  slug: string;
  category: string;
  tags: string[];
  date: string;
  description: string;
}

export interface Post extends PostMeta {
  content: string;
}
