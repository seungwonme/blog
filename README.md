# seunan.dev

터미널 UI 기반 개인 블로그. 명령어로 글을 탐색하고, AI에게 질문할 수 있습니다.

Live: https://seunan.dev

## Stack

- **Runtime**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS v4, shadcn/ui (New York), next-themes
- **Quality**: Biome (lint/format), Steiger (FSD 검증), Lefthook
- **AI**: LangGraph + Google Gemini + Pinecone (Ask 기능용 RAG)

## Architecture

[Feature-Sliced Design](https://feature-sliced.design) + Next.js App Router.

```
app/       Next.js 라우팅 (FSD pages에서 re-export)
src/
├── app/       providers · 전역 설정
├── pages/     페이지 컴포지션 (home)
├── widgets/   terminal
├── features/  ask · command-input · command-executor · terminal-output
├── entities/  command · file-system · post
└── shared/    ui · lib · api · hooks · generated
content/      posts · digest · about (markdown)
scripts/      posts.json 생성 · 임베딩 업서트
```

자세한 규칙은 [`AGENTS.md`](./AGENTS.md)와 각 하위 디렉토리의 `AGENTS.md`를 참고.

## Getting Started

```bash
pnpm install
pnpm dev   # localhost:3000
```

`.env.local` 필수 키:

```bash
NEXT_PUBLIC_SITE_URL=https://seunan.dev
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<code>
GEMINI_API_KEY=<key>
PINECONE_API_KEY=<key>
PINECONE_INDEX=<index-name>
```

## Scripts

| Script | 설명 |
| --- | --- |
| `pnpm dev` | 개발 서버 (`predev`에서 `posts.json` 재생성) |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm lint` / `pnpm check` | Biome lint / 자동 수정 |
| `pnpm lint:fsd` | Steiger FSD 아키텍처 검증 |
| `pnpm upsert-embeddings` | `content/**/*.md`를 Pinecone에 임베딩 업서트 |
| `pnpm repomix` | 저장소 스냅샷 생성 |

## Content

- **Posts** — `content/posts/*.md`, frontmatter `category` 기반 분류 (`dev`, `til` 등)
- **Digest** — `content/digest/YYYY-MM-DD.md`, 일일 뉴스레터 형식
- **About** — `content/about.md`

빌드 시 `scripts/generate-posts-json.ts`가 이 세 소스를 `src/shared/generated/posts.json`으로 통합합니다.

## Deploy

Vercel 연결. `main` 푸시 시 자동 배포.

## License

© Aiden Ahn (@seungwonme). 코드는 MIT, 글은 CC BY-NC 4.0.
