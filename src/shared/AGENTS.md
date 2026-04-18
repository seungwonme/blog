<!-- Parent: ../AGENTS.md -->

# shared — 프로젝트 공통 레이어

비즈니스 도메인 무관한 UI, 유틸, 외부 API 클라이언트. 가장 낮은 레이어 — 상위 레이어 import 금지.

## Segments

| Segment | 내용 |
| --- | --- |
| `ui/` | 재사용 UI 컴포넌트 (`terminal-cursor`, `terminal-prompt`, `faulty-terminal`, shadcn/ui 컴포넌트). `"use client"` 주의 |
| `lib/` | 순수 유틸 (`utils` — tailwind-merge/clsx `cn`), `json-ld` (JSON-LD 생성기), `ascii-banner` |
| `api/` | 외부 서비스 클라이언트 (`gemini/client.ts`, `pinecone/client.ts`). 서버 전용 |
| `hooks/` | React 훅 (`use-mobile`) |
| `generated/` | `posts.json` — 빌드 타임 자동 생성, **수동 편집 금지** |

## Key Utilities

- `cn(...classes)` — Tailwind 클래스 병합
- `<JsonLd data={...} />` — 스크립트 태그 렌더
- `createWebSiteJsonLd()`, `createArticleJsonLd(post)` — 구조화 데이터 생성
- `ASCII_BANNER` — 터미널 기동 시 출력되는 아스키 로고

## For AI Agents

- 새 shadcn 컴포넌트: `pnpm dlx shadcn@latest add <name>` → `shared/ui/`에 자동 배치.
- `api/gemini`, `api/pinecone`은 환경변수 필요 (`GEMINI_API_KEY`, `PINECONE_API_KEY`). 서버 코드에서만 호출.
- 프로젝트 도메인 개념(post, command 등)이 섞이면 `shared`가 아님 → 해당 entity로 이동.

<!-- MANUAL: -->
