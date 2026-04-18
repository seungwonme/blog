import type { PostMeta } from "@/entities/post";
import { TerminalWindow } from "@/widgets/terminal";

interface HomePageProps {
  posts: PostMeta[];
  aboutContent: string;
  initialCommand?: string;
  preloadedContent?: Record<string, string>;
}

export function HomePage({
  posts,
  aboutContent,
  initialCommand,
  preloadedContent,
}: HomePageProps) {
  return (
    <TerminalWindow
      posts={posts}
      aboutContent={aboutContent}
      initialCommand={initialCommand}
      preloadedContent={preloadedContent}
    />
  );
}
