import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { getAboutContent, getAllEntriesMeta } from "@/entities/post";
import { HomePage } from "@/pages/home";
import {
  createFAQJsonLd,
  createPersonJsonLd,
  createWebPageJsonLd,
  JsonLd,
} from "@/shared/lib";

const FAQ_ITEMS = [
  {
    question: "Aiden Ahn은 누구인가요?",
    answer:
      "안승원(Aiden Ahn)은 대모산개발단(DemoDev) 공동창업자이자 조코딩AX파트너스 AX Director입니다. AI 자동화, 바이브 코딩, 워크플로우 설계를 전문으로 합니다.",
  },
  {
    question: "무슨 일을 하시나요?",
    answer:
      "기업 임직원 대상 AI 바이브코딩 교육, 외주 솔루션 개발, AI 에이전트/자동화 워크플로우 설계를 주로 합니다. 패스트캠퍼스, 오즈코딩스쿨, 대웅제약, 이랜드, 슈피겐, 현대자동차그룹 등에서 강의를 진행했습니다.",
  },
  {
    question: "어떤 기술 스택을 사용하나요?",
    answer:
      "Next.js, TypeScript, React, Supabase, n8n, Claude Code, LangChain/LangGraph, Vercel을 주로 사용합니다. 바이브 코딩과 AI 에이전트 오케스트레이션에 깊이 관심이 있습니다.",
  },
  {
    question: "어떻게 연락하나요?",
    answer:
      "이메일은 senugw0u@gmail.com으로 보내주세요. GitHub은 github.com/seungwonme, LinkedIn은 linkedin.com/in/seungwon-aiden 입니다.",
  },
  {
    question: "seunan.dev는 어떤 블로그인가요?",
    answer:
      "Aiden Ahn이 운영하는 터미널 스타일 개발 블로그입니다. AI 자동화, 에이전트 엔지니어링, 바이브 코딩에 관한 글과 일일 AI 뉴스 다이제스트를 제공합니다.",
  },
];

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
      <JsonLd data={createFAQJsonLd(FAQ_ITEMS)} />
      {/* SSR content for crawlers (visually hidden) */}
      <div className="sr-only">
        <article>
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
            {aboutContent}
          </ReactMarkdown>
        </article>
        <section>
          <h2>Frequently Asked Questions</h2>
          {FAQ_ITEMS.map((item) => (
            <div key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </section>
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
