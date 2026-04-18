import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { getAboutContent, getAllEntriesMeta } from "@/entities/post";
import { HomePage } from "@/pages/home";
import { createPersonJsonLd, createWebPageJsonLd, JsonLd } from "@/shared/lib";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://seunan.dev";

export const metadata: Metadata = {
  title: "About",
  description:
    "Aiden Ahn (안승원) — JAX Partners AX Director, DemoDev Co-founder. AI 자동화, 바이브 코딩, 워크플로우 설계 전문.",
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: "About | seunan.dev",
    description:
      "Aiden Ahn (안승원) — JAX Partners AX Director, DemoDev Co-founder. AI 자동화, 바이브 코딩, 워크플로우 설계 전문.",
    type: "profile",
    url: `${SITE_URL}/about`,
  },
  twitter: {
    card: "summary_large_image",
    title: "About | seunan.dev",
    description:
      "Aiden Ahn (안승원) — JAX Partners AX Director, DemoDev Co-founder.",
  },
};

export default function AboutPage() {
  const posts = getAllEntriesMeta();
  const aboutContent = getAboutContent();

  return (
    <>
      <JsonLd
        data={createWebPageJsonLd({
          title: "About - Aiden Ahn",
          description:
            "Aiden Ahn (안승원) — AI 자동화, 바이브 코딩, 워크플로우 설계 전문.",
          url: `${SITE_URL}/about`,
        })}
      />
      <JsonLd
        data={createPersonJsonLd({
          name: "Aiden Ahn",
          url: SITE_URL,
          jobTitle: "Software Engineer & Co-founder",
          worksFor: {
            name: "대모산개발단 (DemoDev)",
            url: "https://demodev.io",
          },
          sameAs: [
            "https://github.com/seungwonme",
            "https://www.linkedin.com/in/seungwon-aiden/",
          ],
        })}
      />
      {/* SSR content for crawlers (visually hidden) */}
      <div className="sr-only">
        <article>
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
            {aboutContent}
          </ReactMarkdown>
        </article>
      </div>
      {/* Terminal UI with about command auto-executed */}
      <HomePage
        posts={posts}
        aboutContent={aboutContent}
        initialCommand="about"
      />
    </>
  );
}
