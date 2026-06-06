import { getAboutContent, getAllEntriesMeta } from "@/entities/post";
import { HomePage } from "@/pages/home";
import { createBlogJsonLd, JsonLd } from "@/shared/lib";

interface Props {
  searchParams: Promise<{ q?: string | string[] }>;
}

function buildInitialCommand(
  q: string | string[] | undefined,
): string | undefined {
  if (!q) return undefined;
  const raw = Array.isArray(q) ? q[0] : q;
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  // Strip control chars and quotes that would break the command string
  const safe = trimmed.replace(/["`\r\n]/g, " ").slice(0, 200);
  return `grep ${safe}`;
}

export default async function Page({ searchParams }: Props) {
  const { q } = await searchParams;
  const posts = getAllEntriesMeta();
  const aboutContent = getAboutContent();
  const initialCommand = buildInitialCommand(q);

  return (
    <>
      {/* 홈: 사이트 콘텐츠 폭·최신성을 Blog 스키마로 노출 (저자는 layout의 Person @id 참조) */}
      <JsonLd data={createBlogJsonLd(posts.slice(0, 20))} />
      <HomePage
        posts={posts}
        aboutContent={aboutContent}
        initialCommand={initialCommand}
      />
    </>
  );
}
