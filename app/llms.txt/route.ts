import { getAllEntriesMeta } from "@/entities/post";

// AI 크롤러용 큐레이션 인덱스(llms.txt 표준). 콘텐츠 추가 시 빌드 타임에 자동 갱신된다.
export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.seunan.dev";
const RAW_BASE =
  "https://raw.githubusercontent.com/seungwonme/blog/main/content";
const DIGEST_PREVIEW = 10;

export function GET() {
  const entries = getAllEntriesMeta();
  const posts = entries.filter((e) => e.category !== "digest");
  const digests = entries.filter((e) => e.category === "digest");

  const lines: string[] = [
    "# seunan.dev",
    "",
    "> 안승원(Aiden Ahn)의 터미널 UI 개인 기술 블로그. 저자는 조코딩AX파트너스 AX Director이자 대모산개발단 공동창업자(CCO)로, AI 에이전트·CLI·바이브 코딩·업무 자동화와 AI 교육을 다룬다. 글은 한국어이며 dev/til 카테고리 포스트와 일일 AI 뉴스 다이제스트로 구성된다.",
    "",
    "## About",
    `- [About — Aiden Ahn](${SITE_URL}/about): 저자 경력·강의 이력·수상·연락처. 원문(md): ${RAW_BASE}/about.md`,
    "",
    "## Posts",
  ];

  for (const p of posts) {
    const desc = p.description ? `: ${p.description}` : "";
    lines.push(`- [${p.title}](${SITE_URL}/posts/${p.slug})${desc}`);
  }

  lines.push("", "## Daily AI Digest");
  for (const d of digests.slice(0, DIGEST_PREVIEW)) {
    const desc = d.description ? `: ${d.description}` : "";
    lines.push(`- [${d.title}](${SITE_URL}/posts/${d.slug})${desc}`);
  }
  if (digests.length > DIGEST_PREVIEW) {
    lines.push(
      `- 그 외 ${digests.length - DIGEST_PREVIEW}편의 일일 AI digest는 ${SITE_URL}/sitemap.xml 참조`,
    );
  }

  lines.push(
    "",
    "## Source",
    `- 콘텐츠 원문(Markdown): https://github.com/seungwonme/blog/tree/main/content`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
