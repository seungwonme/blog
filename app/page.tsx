import { getAboutContent, getAllEntriesMeta } from "@/entities/post";
import { HomePage } from "@/pages/home";
import { createPersonJsonLd, JsonLd } from "@/shared/lib";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://seunan.dev";

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
      <JsonLd
        data={createPersonJsonLd({
          name: "Aiden Ahn",
          url: SITE_URL,
          jobTitle: "Software Engineer & Co-founder",
          worksFor: {
            name: "대모산개발단 (DemoDev)",
            url: "https://demodev.io",
          },
          sameAs: ["https://github.com/seungwonme"],
        })}
      />
      <HomePage
        posts={posts}
        aboutContent={aboutContent}
        initialCommand={initialCommand}
      />
    </>
  );
}
