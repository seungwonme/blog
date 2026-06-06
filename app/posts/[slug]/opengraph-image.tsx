import { ImageResponse } from "next/og";
import { getAllEntries, getEntryBySlug } from "@/entities/post";

export const alt = "seunan.dev";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllEntries().map((entry) => ({ slug: entry.slug }));
}

// 한글 렌더를 위해 Pretendard를 빌드 타임에 로드(satori는 woff2 미지원 → woff 사용).
// fetch 실패 시 기본 폰트로 폴백(빌드는 깨지지 않음).
const FONT_URL =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/web/static/woff/Pretendard-Bold.woff";

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(FONT_URL);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getEntryBySlug(slug);
  const title = post?.title ?? "seunan.dev";
  const category = post?.category ?? "post";
  const date = post?.date ?? "";
  const fontData = await loadFont();

  const dot = (color: string) => ({
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: color,
  });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1e1e2e",
        color: "#cdd6f4",
        padding: "72px",
        fontFamily: fontData ? "Pretendard" : "sans-serif",
      }}
    >
      <div style={{ display: "flex", gap: "12px", marginBottom: "40px" }}>
        <div style={dot("#f38ba8")} />
        <div style={dot("#f9e2af")} />
        <div style={dot("#a6e3a1")} />
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 28,
          color: "#a6e3a1",
          marginBottom: 24,
        }}
      >
        {`$ cat ${category}/${slug}`}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 64,
          fontWeight: 700,
          lineHeight: 1.25,
          flex: 1,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 28,
          color: "#9399b2",
        }}
      >
        <span>seunan.dev</span>
        <span>{date}</span>
      </div>
    </div>,
    {
      ...size,
      fonts: fontData
        ? [{ name: "Pretendard", data: fontData, style: "normal", weight: 700 }]
        : undefined,
    },
  );
}
