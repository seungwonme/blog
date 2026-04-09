# Next.js Boilerplate

## Commands

```bash
pnpm dev              # Dev server (localhost:3000)
pnpm build            # Production build
pnpm lint             # Biome lint
pnpm check            # Biome lint + format + auto-fix
pnpm lint:fsd         # Steiger FSD architecture lint
pnpm dlx shadcn@latest add <component>  # Add shadcn/ui component
```

## Tech Stack

- Next.js 16, React 19, TypeScript 5
- Tailwind CSS v4 (config in `globals.css` only)
- shadcn/ui (New York style)
- Biome (linter/formatter)
- Steiger (FSD linter)
- next-themes (dark mode)

## Architecture (FSD)

### Layer Structure

```
app/                  # Next.js App Router (routing only)
src/
├── app/              # Providers, global config
├── pages/            # Page composition
├── widgets/          # Header, Footer, Sidebar
├── features/         # auth, checkout, search
├── entities/         # user, product, order
└── shared/           # ui, lib, api, hooks
```

### Import Rules

```typescript
// 의존성 방향: app → pages → widgets → features → entities → shared
// 같은 레이어 내 cross-import 금지

// ✅ Correct - index.ts를 통한 import
import { UserCard } from '@/entities/user';
import { Button } from '@/shared/ui';

// ❌ Wrong - 내부 구조 직접 접근
import { UserCard } from '@/entities/user/ui/user-card';
```

### Next.js + FSD Integration

```typescript
// app/example/page.tsx
export { ExamplePage as default } from '@/pages/example';

// src/pages/example/index.ts
export { ExamplePage } from './ui/example-page';

// src/pages/example/ui/example-page.tsx
import { Header } from '@/widgets/header';
import { AuthForm } from '@/features/auth';
import { Button } from '@/shared/ui';
```

### Server Actions

```typescript
// src/features/auth/api/actions.ts
'use server';
export async function signIn(formData: FormData) {
  /* ... */
}

// 배치 위치:
// - Feature-specific: src/features/[feature]/api/actions.ts
// - Entity-specific: src/entities/[entity]/api/actions.ts
// - Shared: src/shared/api/actions.ts
```

## Conventions

### Naming

| 대상            | 규칙       | 예시            |
| --------------- | ---------- | --------------- |
| 파일명          | kebab-case | `user-card.tsx` |
| 컴포넌트        | PascalCase | `UserCard`      |
| 함수/변수       | camelCase  | `handleClick`   |
| 타입/인터페이스 | PascalCase | `UserProfile`   |

### Components

```typescript
// Server Component (기본)
export function UserCard() {
  /* ... */
}
```

```typescript
// Client Component (상호작용 필요 시)
// 파일 최상단에 directive 선언 필수
"use client";

export function InteractiveForm() {
  /* ... */
}
```

### Icons

```typescript
import { Menu, X } from 'lucide-react'; // 일반 아이콘
import { FaGithub } from 'react-icons/fa'; // 브랜드/SNS 아이콘
```

### Dark Mode

```tsx
<div className="bg-white dark:bg-black text-black dark:text-white">Content</div>
```

## SEO

### 환경 변수

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-google-verification-code
```

### 파일 구조

| 파일              | 설명                              |
| ----------------- | --------------------------------- |
| `app/layout.tsx`  | 전역 Metadata, Open Graph, 등     |
| `app/robots.ts`   | 검색엔진 크롤러 규칙              |
| `app/sitemap.ts`  | 동적 사이트맵 생성                |
| `app/manifest.ts` | PWA 웹 앱 매니페스트              |

### JSON-LD 구조화 데이터

```typescript
import { JsonLd, createWebSiteJsonLd, createArticleJsonLd } from '@/shared/lib';

// 페이지에서 사용
export default function Page() {
  return (
    <>
      <JsonLd data={createWebSiteJsonLd()} />
      {/* 페이지 컨텐츠 */}
    </>
  );
}
```

### 페이지별 Metadata

```typescript
// app/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About', // "About | Site Name" 형식으로 출력
  description: 'About page description',
};
```

## Content Types

### Posts
- Location: `content/posts/*.md`
- Category from frontmatter (e.g., `dev`, `til`)
- Parsed by `scripts/generate-posts-json.ts` into `src/shared/generated/posts.json`

### Digests
- Location: `content/digest/*.md`
- Daily newsletter-style markdown with `category: digest`
- Frontmatter: `title`, `slug` (date-based, e.g., `2026-03-24`), `category`, `tags`, `date`, `description`
- Parsed alongside posts in the same generate script, stored as `digests[]` in `posts.json`
- Accessed via `getDigests()`, `getDigestBySlug()` from `@/entities/post`
- Appears as `digest/` directory in the terminal virtual filesystem
- Terminal command: `cat digest/2026-03-24`

### Private Notes
- Location: `content/_private/*.md`
- Purpose: 블로그 작업 관련 비공개 로컬 메모 저장 경로
- Git: `.gitignore`에서 `/content/_private/` 경로를 무시
- Current generator scope: `scripts/generate-posts-json.ts`는 `content/posts`, `content/digest`, `content/about.md`만 읽음

## Key Paths

| 용도           | 경로                               |
| -------------- | ---------------------------------- |
| UI 컴포넌트    | `src/shared/ui/`                   |
| 유틸리티       | `src/shared/lib/`                  |
| 훅             | `src/shared/hooks/`                |
| API 클라이언트 | `src/shared/api/`                  |
| 테마           | `src/shared/ui/theme-provider.tsx` |
| shadcn 설정    | `components.json`                  |
| Tailwind 설정  | `app/globals.css`                  |

## Project Notes

- 2026-04-09: `content/digest/2026-04-09.md`를 `daily-digest` 스킬 하드 룰에 맞춰 다시 재생성했다. 카테고리별 초안(`sns/reddit/news/youtube/hf1/hf2/arxiv1/2/3/5`)을 별도 서브에이전트로 만든 뒤 퇴고 에이전트가 `32`개 `Draft-ID`, `32`개 `###`, `1146`줄 구조로 통합했고, 기준선 digest(`2026-04-08`) 대비 밀도 검증을 통과하도록 수치와 사례를 보존했다.
- 2026-04-09: `content/digest/2026-04-09.md`를 카테고리별 서브에이전트 초안(`sns/news/reddit/youtube/hf/arxiv`) 기준으로 다시 재생성했다. 운영체계·평가 재설계·비용/생태계·지식 협업·현실세계 추론·보안 거버넌스 중심의 주제 클러스터 구조로 통합했다.
- 2026-04-09: `content/digest/2026-04-09.md`를 서브에이전트 초안(`sns/news/reddit/youtube/papers`) 기준으로 다시 재생성했다. `2026-04-08`과 같은 `## 섹션 + ### 세부 항목` 구조로 복원하고, 본문 보유 수집분 255건을 에이전트 운영·보안·연구·조직 흐름으로 압축 정리했다.
- 2026-04-09: `content/digest/2026-04-09.md`를 다시 삭제 후 재생성했다. 기존의 누적 보강/인덱스 중심 구조를 걷어내고, agent 운영체계·보안 공개 전략·경량 도구·비즈니스 운영·연구 레이더 중심의 서술형 digest로 통합했다.
- 2026-04-09: `content/digest/2026-04-09.md`를 기존 누적 보강본 대신 새 구조로 전면 재작성했다. 핵심 해설 섹션을 다시 쓰고, 뉴스/YouTube/SNS/논문 전수 인덱스로 오늘 수집분 전체를 다시 정리했다.
- 2026-04-09: `content/digest/2026-04-09.md`에 URL 누락분 보강 부록을 추가해 Every 2건, YouTube 2건, Hugging Face/arXiv 논문 전수 링크와 핵심 포인트를 반영했다.
- 2026-04-09: Expanded `content/digest/2026-04-09.md` after the initial publish to cover omitted social/community sources from today's skim crawl, including LinkedIn, Threads, X, and Reddit stream summaries.
- 2026-04-09: Added daily digest at `content/digest/2026-04-09.md` from today's skim crawl coverage, focusing on 31 entries with non-empty `content_markdown` across Hacker News, GeekNews, and YouTube.
- 2026-04-08: Added daily digest at `content/digest/2026-04-08.md` from today's skim draft coverage and reorganized all draft sections into topic clusters.
