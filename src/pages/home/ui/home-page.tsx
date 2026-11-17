import type { ReactNode } from "react";
import type { PostMeta } from "@/entities/post";
import { TerminalWindow } from "@/widgets/terminal";

interface HomePageProps {
  posts: PostMeta[];
  aboutContent: string;
  aboutPath?: string;
  headerAction?: ReactNode;
  initialCommand?: string;
  initialPath?: string;
  preloadedContent?: Record<string, string>;
}

export function HomePage({
  posts,
  aboutContent,
  aboutPath,
  headerAction,
  initialCommand,
  initialPath,
  preloadedContent,
}: HomePageProps) {
  return (
    <TerminalWindow
      posts={posts}
      aboutContent={aboutContent}
      aboutPath={aboutPath}
      headerAction={headerAction}
      initialCommand={initialCommand}
      initialPath={initialPath}
      preloadedContent={preloadedContent}
    />
  );
}
