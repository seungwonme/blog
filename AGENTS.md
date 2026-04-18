# Blog — seunan.dev

터미널 UI 기반 개인 블로그. Next.js 16 App Router + React 19 + FSD 아키텍처.

## Commands

```bash
pnpm dev              # 개발 서버 (prebuild: posts.json 생성)
pnpm build            # 프로덕션 빌드
pnpm lint             # Biome lint
pnpm check            # Biome lint + format + auto-fix
pnpm lint:fsd         # Steiger FSD 검증
pnpm dlx shadcn@latest add <component>
```

## Tech Stack

- Next.js 16 · React 19 · TypeScript 5
- Tailwind v4 (설정은 `app/globals.css`에만)
- shadcn/ui (New York) · Biome · Steiger · next-themes
- AI: `@langchain/langgraph` + `@langchain/google-genai` + `@pinecone-database/pinecone`

## Architecture (FSD)

```
app/       # Next.js App Router (라우팅 전용 · re-export만)
src/
├── app/       # Providers, 전역 설정
├── pages/     # 페이지 컴포지션
├── widgets/   # terminal
├── features/  # ask, command-*, terminal-output
├── entities/  # command, file-system, post
└── shared/    # ui, lib, api(gemini/pinecone), hooks, generated
```

### Import Rules

- 의존성 방향: `app → pages → widgets → features → entities → shared`
- 같은 레이어 내 cross-import 금지
- 반드시 `index.ts` 경유: `import { X } from '@/entities/post'` (O) / `'@/entities/post/api/get-posts'` (X)
- Server Actions: feature/entity별 `api/actions.ts`, 공용은 `src/shared/api/`

## Conventions

| 대상 | 규칙 | 예시 |
| --- | --- | --- |
| 파일명 | kebab-case | `user-card.tsx` |
| 컴포넌트/타입 | PascalCase | `UserCard`, `UserProfile` |
| 함수/변수 | camelCase | `handleClick` |

- Server Component 기본, 상호작용 필요 시 `"use client"`
- 아이콘: 일반 `lucide-react`, 브랜드 `react-icons`
- 다크/라이트 모드 필수 (`dark:` prefix)

## Content

- `content/posts/*.md` — 블로그 글 (frontmatter `category`: `dev`, `til` 등)
- `content/digest/*.md` — 일일 digest (`category: digest`, slug는 날짜)
- `content/about.md` — About 페이지
- `content/_private/*.md` — 로컬 비공개 메모 (`.gitignore`됨)
- `scripts/generate-posts-json.ts`가 `posts` + `digest` + `about`을 `src/shared/generated/posts.json`으로 병합

## SEO

- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` 필수
- `app/{layout,robots,sitemap,manifest}.ts`에 전역 메타 설정
- JSON-LD는 `@/shared/lib`의 `JsonLd`, `createWebSiteJsonLd`, `createArticleJsonLd` 사용

## Hierarchical Docs

하위 매뉴얼은 작업 시 자동 로드됨:
- `src/AGENTS.md` — FSD 레이어 상세
- `app/AGENTS.md` — App Router · API routes
- `content/AGENTS.md` — 콘텐츠 스키마
- `scripts/AGENTS.md` — 빌드/임베딩 스크립트

<!-- MANUAL: 이 줄 아래의 수동 추가 노트는 재생성 시 보존됨 -->
