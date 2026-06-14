import type { PostMeta } from "@/entities/post";
import { TerminalWindow } from "@/widgets/terminal";

interface HomePageProps {
  posts: PostMeta[];
  aboutContent: string;
  initialCommand?: string;
  initialPath?: string;
  preloadedContent?: Record<string, string>;
}

export function HomePage({
  posts,
  aboutContent,
  initialCommand,
  initialPath,
  preloadedContent,
}: HomePageProps) {
  return (
    <TerminalWindow
      posts={posts}
      aboutContent={aboutContent}
      initialCommand={initialCommand}
      initialPath={initialPath}
      preloadedContent={preloadedContent}
    />
  );
}
