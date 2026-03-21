import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "seunan.dev",
    short_name: "seunan",
    description:
      "Aiden Ahn의 터미널 스타일 개발 블로그 — AI, 바이브 코딩, 자동화",
    start_url: "/",
    display: "standalone",
    background_color: "#1e1e2e",
    theme_color: "#1e1e2e",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
