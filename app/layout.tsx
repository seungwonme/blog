import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { createPersonJsonLd, createWebSiteJsonLd, JsonLd } from "@/shared/lib";
import "./globals.css";

const SITE_NAME = "seunan.dev";
const SITE_DESCRIPTION =
  "안승원(Aiden Ahn)의 터미널 UI 개발 블로그. 조코딩AX파트너스 AX Director이자 대모산개발단 공동창업자가 AI 에이전트, 바이브 코딩, 업무 자동화에 관한 글과 일일 AI 뉴스 다이제스트를 공유합니다.";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.seunan.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Aiden Ahn",
    "안승원",
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
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    images: [
      {
        url: "/og-image.png",
        width: 2400,
        height: 1260,
        alt: "seunan.dev — Aiden Ahn의 터미널 스타일 개발 블로그",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
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
