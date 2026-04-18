import type { PostMeta } from "@/entities/post";
import { TerminalWindow } from "@/widgets/terminal";

interface HomePageProps {
  posts: PostMeta[];
  aboutContent: string;
  initialCommand?: string;
}

export function HomePage({
  posts,
  aboutContent,
  initialCommand,
}: HomePageProps) {
  return (
    <TerminalWindow
      posts={posts}
      aboutContent={aboutContent}
      initialCommand={initialCommand}
    />
  );
}
