import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.aidenahn.com";

// 전략: AI 검색·학습 크롤러를 모두 명시적으로 허용해 브랜드 노출을 극대화한다.
// (* 규칙이 이미 전체 허용이지만, 봇별 명시 규칙이 우선 적용되고 의도가 코드로 남는다.)
// 학습 데이터 제외가 필요해지면 GPTBot/ClaudeBot/Google-Extended/Applebot-Extended를
// 검색 봇과 분리해 disallow: ["/"]로 옮기면 된다.
const AI_BOT_USER_AGENTS = [
  // OpenAI (학습 GPTBot / 검색 OAI-SearchBot / 사용자 fetch ChatGPT-User)
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic (학습 ClaudeBot / 사용자 Claude-User / 검색 Claude-SearchBot)
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai", // deprecated 레거시 식별자(옛 로그 호환용 유지)
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Google / Apple / Amazon / Meta / Microsoft / Mistral / 기타
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "meta-externalagent",
  "Bingbot",
  "MistralAI-User",
  "DuckAssistBot",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      ...AI_BOT_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/api/"],
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
