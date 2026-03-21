import type { Post } from "@/entities/post";
import { TerminalWindow } from "@/widgets/terminal";

interface HomePageProps {
  posts: Post[];
  initialCommand?: string;
}

export function HomePage({ posts, initialCommand }: HomePageProps) {
  return <TerminalWindow posts={posts} initialCommand={initialCommand} />;
}
