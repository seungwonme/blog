import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_NAME = "seunan.dev";
const SITE_DESCRIPTION =
  "Terminal-style blog powered by Notion — Catppuccin Mocha theme";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://seunan.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "blog",
    "terminal",
    "catppuccin",
    "notion",
    "developer",
    "Aiden Ahn",
  ],
  authors: [{ name: "Aiden Ahn" }],
  creator: "Aiden Ahn",
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
        width: 1200,
        height: 630,
        alt: SITE_NAME,
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
  },
};

export const viewport: Viewport = {
  themeColor: "#1e1e2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-theme="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
