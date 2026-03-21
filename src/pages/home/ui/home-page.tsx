import type { Post } from "@/entities/post";
import { TerminalWindow } from "@/widgets/terminal";

interface HomePageProps {
  posts: Post[];
}

export function HomePage({ posts }: HomePageProps) {
  return <TerminalWindow posts={posts} />;
}
