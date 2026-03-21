export interface Post {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  date: string;
  description: string;
  content: string;
  coverUrl: string | null;
}
