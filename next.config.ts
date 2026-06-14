import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// 구 URL(/posts/슬러그)을 정식 구조(/카테고리/슬러그)로 308 영구 리다이렉트.
// posts.json(prebuild/predev에서 생성)을 읽어 슬러그→카테고리를 매핑하므로,
// 검색엔진 색인·기존 공유 링크의 신호가 새 canonical URL로 누적된다.
const POSTS_JSON = path.join(process.cwd(), "src/shared/generated/posts.json");

function legacyPostRedirects() {
  if (!fs.existsSync(POSTS_JSON)) return [];
  const data = JSON.parse(fs.readFileSync(POSTS_JSON, "utf-8")) as {
    posts?: { slug: string; category: string }[];
    digests?: { slug: string; category: string }[];
  };
  const entries = [...(data.posts ?? []), ...(data.digests ?? [])];
  return entries.map((entry) => ({
    source: `/posts/${entry.slug}`,
    destination: `/${entry.category}/${entry.slug}`,
    permanent: true,
  }));
}

const nextConfig: NextConfig = {
  async redirects() {
    return legacyPostRedirects();
  },
};

export default nextConfig;
