import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { createPersonJsonLd, createWebSiteJsonLd, JsonLd } from "@/shared/lib";
import "./globals.css";

const SITE_NAME = "aidenahn.com"; // 브랜드(제목 접미사 template·og:siteName 용)
const SITE_TITLE = "안승원(Aiden Ahn)의 개발 블로그"; // 홈/OG 제목(도메인명 대신 설명형)
const SITE_DESCRIPTION =
  "안승원(Aiden Ahn)의 개발 블로그. 기업의 AX, AI 에이전트, 바이브 코딩, 업무 자동화와 일일 AI 뉴스 다이제스트를 다룹니다."; // 네이버 권장 80자 이내(78자)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.aidenahn.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Aiden Ahn",
    "안승원",
    "AX",
    "개발 블로그",
    "소프트웨어 엔지니어",
    "AI",
    "바이브 코딩",
    "vibe coding",
    "자동화",
    "n8n",
    "Claude Code",
    "대모산개발단",
    "DemoDev",
    "터미널 블로그",
  ],
  authors: [{ name: "Aiden Ahn", url: "https://github.com/seungwonme" }],
  creator: "Aiden Ahn",
  publisher: "Aiden Ahn",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    images: [
      {
        url: "/og-image.png",
        width: 2400,
        height: 1260,
        alt: "aidenahn.com — Aiden Ahn의 터미널 스타일 개발 블로그",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || "",
      "naver-site-verification":
        process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "",
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1e2e" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-theme="dark" suppressHydrationWarning>
      <body className="antialiased">
        {/* 전역 엔티티 그래프: WebSite + 저자 Person(@id로 모든 페이지에서 참조됨) */}
        <JsonLd data={createWebSiteJsonLd()} />
        <JsonLd data={createPersonJsonLd()} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
