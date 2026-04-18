<!-- Parent: ../AGENTS.md -->

# app — Next.js App Router

## Purpose

Next.js 라우팅 계층. 페이지 컴포넌트는 **FSD `src/pages/`에서 re-export**만 하고, 여기서는 라우팅·메타데이터·API route handler만 정의한다.

## Key Files

| File | 역할 |
| --- | --- |
| `layout.tsx` | 전역 metadata, JSON-LD, Analytics, theme provider |
| `page.tsx` | 홈 페이지 (`src/pages/home`에서 re-export) |
| `not-found.tsx` | 404 페이지 |
| `globals.css` | Tailwind v4 전체 설정 (이 파일에만 작성) |
| `robots.ts` / `sitemap.ts` / `manifest.ts` | SEO/PWA 메타 |
| `icon.png` | favicon |

## Subdirectories

| Dir | 설명 |
| --- | --- |
| `about/` | About 페이지 (`content/about.md` 렌더) |
| `posts/[slug]/` | 포스트 상세 (digest 포함) |
| `api/posts/[slug]/` | 포스트 raw JSON API |
| `api/ask/` | AI 질문 API (`features/ask` 호출) |

## For AI Agents

- 페이지 파일은 `src/pages/*`에서 import 후 `export default`만. 비즈니스 로직 넣지 말 것.
- API route는 `NextResponse` 사용. `src/features/*/api/`의 함수를 호출하는 얇은 래퍼 유지.
- 페이지별 metadata는 해당 `page.tsx`의 `export const metadata`로. 루트 `layout.tsx`의 template이 `%s | seunan.dev` 형태로 래핑.
- `app/` 안에서 `src/*`를 직접 import할 때는 `@/` 경로 사용.

<!-- MANUAL: -->
