import type { Metadata } from "next";
import type { AboutLanguage } from "@/entities/post";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.aidenahn.com";

export const ABOUT_VERSIONS = {
  ko: {
    path: "/about",
    label: "한국어",
    locale: "ko_KR",
    description:
      "Aiden Ahn (안승원) - NomaDamas DevRel / OSS Growth, DemoDev Co-founder. AI 에이전트, 오픈소스 성장, 워크플로우 자동화.",
    faq: [
      {
        question: "Aiden Ahn은 누구인가요?",
        answer:
          "안승원(Aiden Ahn)은 주식회사 마커가 운영하는 NomaDamas에서 DevRel과 OSS Growth를 담당하는 AI Native Engineer이자 대모산개발단 공동창업자입니다.",
      },
      {
        question: "무슨 일을 하시나요?",
        answer:
          "AI 오픈소스 프로젝트의 유즈케이스 콘텐츠, SNS, SEO, GitHub 성장 시스템을 구축하고 기업 임직원 대상 AI 바이브코딩 교육과 AI 에이전트 워크플로우 설계를 합니다.",
      },
      {
        question: "어떤 기술 스택을 사용하나요?",
        answer:
          "Next.js, TypeScript, React, Supabase, n8n, Claude Code, LangChain/LangGraph, Vercel을 주로 사용합니다. 바이브 코딩과 AI 에이전트 오케스트레이션에 깊이 관심이 있습니다.",
      },
      {
        question: "어떻게 연락하나요?",
        answer:
          "이메일은 hello@aidenahn.com으로 보내주세요. GitHub은 github.com/seungwonme, LinkedIn은 linkedin.com/in/seungwon-aiden 입니다.",
      },
      {
        question: "aidenahn.com는 어떤 블로그인가요?",
        answer:
          "Aiden Ahn이 운영하는 터미널 스타일 개발 블로그입니다. AI 자동화, 에이전트 엔지니어링, 바이브 코딩에 관한 글과 일일 AI 뉴스 다이제스트를 제공합니다.",
      },
    ],
  },
  en: {
    path: "/about/en",
    label: "English",
    locale: "en_US",
    description:
      "Aiden Ahn works on developer relations and open-source growth at NomaDamas and co-founded DemoDev. His work covers AI agents and workflow automation.",
    faq: [
      {
        question: "Who is Aiden Ahn?",
        answer:
          "Aiden Ahn is an AI-native engineer and co-founder of DemoDev. He works on developer relations and open-source growth at NomaDamas, which is operated by Markr.",
      },
      {
        question: "What does Aiden work on?",
        answer:
          "He creates content about how to use open-source AI projects, manages social media and search visibility, and develops ways to grow projects on GitHub. He also teaches vibe coding to company teams and designs AI agent workflows.",
      },
      {
        question: "What tools does Aiden use?",
        answer:
          "He primarily uses Next.js, TypeScript, React, Supabase, n8n, Claude Code, LangChain, LangGraph, and Vercel. He is particularly interested in vibe coding and orchestrating AI agents.",
      },
      {
        question: "How can I contact Aiden?",
        answer:
          "Email him at hello@aidenahn.com, find him on GitHub at github.com/seungwonme, or reach him on LinkedIn at linkedin.com/in/seungwon-aiden.",
      },
      {
        question: "What is aidenahn.com?",
        answer:
          "It is Aiden Ahn’s terminal-style developer blog, with articles on AI automation, agent engineering, and vibe coding, plus a daily AI news digest.",
      },
    ],
  },
} satisfies Record<
  AboutLanguage,
  {
    path: string;
    label: string;
    locale: string;
    description: string;
    faq: { question: string; answer: string }[];
  }
>;

export function getAboutUrl(language: AboutLanguage): string {
  return new URL(ABOUT_VERSIONS[language].path, SITE_URL).href;
}

export function getAboutMetadata(language: AboutLanguage): Metadata {
  const version = ABOUT_VERSIONS[language];
  const url = getAboutUrl(language);
  const title = "About";
  const socialTitle = `${title} | aidenahn.com`;

  return {
    title,
    description: version.description,
    alternates: {
      canonical: url,
      languages: {
        ko: getAboutUrl("ko"),
        en: getAboutUrl("en"),
      },
    },
    openGraph: {
      title: socialTitle,
      description: version.description,
      type: "profile",
      locale: version.locale,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: version.description,
    },
  };
}
