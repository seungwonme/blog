# Terminal Blog (seunan.dev) - Technical Spec

## Overview

Catpuccin Mocha 테마의 풀 터미널 에뮬레이션 블로그. 로컬 마크다운 파일을 콘텐츠 소스로 사용하며, 방문자는 실제 터미널처럼 명령어를 입력해 블로그를 탐색한다. Gemini AI로 블로그 내용 기반 Q&A를 제공하고, 정적 생성(SSG)으로 SEO를 대응한다.

**도메인**: seunan.dev
**프롬프트**: `visitor@seunan.dev:~$`

## Goals & Non-Goals

### Goals

- 터미널 명령어로 모든 블로그 콘텐츠를 탐색할 수 있다
- `ask` 명령어로 블로그 글 + 프로필 기반 AI 답변을 받을 수 있다
- 정적 생성된 `/posts/[slug]` 페이지로 Google에 인덱싱된다
- 모바일에서는 간소화된 UI로 접근 가능하다

### Non-Goals

- 일반적인 웹 UI 모드 (듀얼 모드 없음, 터미널 전용)
- 댓글/좋아요 등 소셜 기능
- 사용자 인증/로그인
- RSS 피드 (추후 추가 가능)
- 다국어 지원

## User Stories

- 방문자로서, `ls`로 전체 글 목록을 볼 수 있다
- 방문자로서, `cd dev`로 개발 카테고리로 이동하고 해당 카테고리의 글만 볼 수 있다
- 방문자로서, `cat <slug>`로 글을 읽을 수 있다
- 방문자로서, `grep <keyword>`로 글을 검색할 수 있다
- 방문자로서, `ask "질문"`으로 블로그 내용 기반 AI 답변을 받을 수 있다
- 방문자로서, `about`으로 블로그 주인의 상세 프로필을 볼 수 있다
- 방문자로서, `tags`로 사용 가능한 태그 목록을 볼 수 있다
- 방문자로서, `history`로 입력한 명령어 히스토리를 볼 수 있다
- 방문자로서, Tab 키로 명령어/slug를 자동완성할 수 있다

## Technical Architecture

### Tech Stack

| 기술            | 용도                              |
| --------------- | --------------------------------- |
| Next.js 16      | 프레임워크 (App Router)           |
| React 19        | UI                                |
| TypeScript 5    | 타입 시스템                       |
| Tailwind CSS v4 | 스타일링 (Catpuccin Mocha 팔레트) |
| gray-matter     | 마크다운 프론트매터 파싱          |
| react-markdown  | 마크다운 렌더링                   |
| Gemini SDK        | AI 답변 생성                      |
| Vercel          | 배포                              |

### System Design

```
┌─────────────┐      SSG       ┌──────────────┐
│   Browser   │ ◄────────────► │   Next.js    │
│ (Terminal)  │                 │   (Vercel)   │
└─────────────┘                 └──────┬───────┘
                                       │
                         ┌─────────────┼─────────────┐
                         │             │             │
                  ┌──────▼───┐  ┌──────▼──┐   ┌─────▼────┐
                  │  Local   │  │  Gemini   │   │  Static  │
                  │ Markdown │  │   API   │   │  Assets  │
                  └──────────┘  └─────────┘   └──────────┘
```

**데이터 흐름**:
1. 빌드 시 `scripts/generate-posts-json.ts`가 `content/posts/` 마크다운 파일을 파싱하여 `src/shared/generated/posts.json` 생성
2. 브라우저에서는 터미널 UI를 렌더링, 명령어 입력 시 빌드 타임에 생성된 데이터에서 조회
3. `ask` 명령어 시 → Next.js API Route → 키워드 검색으로 관련 글 찾기 → 본문을 Gemini에 전달 → 답변 반환
4. `/posts/[slug]` 정적 페이지로 SEO 대응 (크롤러 + 일반 사용자 모두 접근 가능)

### FSD Architecture

```
app/
├── layout.tsx              # 전역 레이아웃, Catpuccin Mocha 테마
├── page.tsx                # → src/pages/home
├── posts/[slug]/page.tsx   # → src/pages/post (SSR용, 크롤러 대응)
├── robots.ts
├── sitemap.ts
└── manifest.ts

src/
├── app/                    # Providers, 전역 설정
│   └── providers/
├── pages/
│   ├── home/               # 메인 터미널 페이지
│   └── post/               # SSR용 포스트 페이지 (크롤러 전용)
├── widgets/
│   └── terminal/           # 터미널 위젯 (전체 터미널 컨테이너)
├── features/
│   ├── command-input/      # 명령어 입력, 파싱, Tab 자동완성
│   ├── command-executor/   # 명령어 실행 (라우팅)
│   └── terminal-output/    # 출력 렌더링 (타이핑 애니메이션, 마크다운)
├── entities/
│   ├── post/               # 블로그 글 타입, API, 변환
│   ├── command/            # 명령어 타입, 파서
│   └── file-system/        # 가상 파일시스템 (카테고리 → 디렉토리 매핑)
└── shared/
    ├── ui/                 # 공통 UI (커서, 프롬프트 등)
    ├── lib/                # 유틸리티
    ├── api/                # Gemini 클라이언트
    └── config/             # Catpuccin 팔레트, 사이트 설정
```

### Data Model

**마크다운 프론트매터**:

```yaml
# content/posts/<slug>.md
---
title: "글 제목"
slug: "url-slug"           # kebab-case
category: "dev"            # 카테고리 (= 가상 디렉토리명)
tags: ["tag1", "tag2"]
date: "2024-03-01"
description: "글 요약 (한 줄)"
coverUrl: "/images/cover.jpg"  # 선택
---

마크다운 본문...
```

**가상 파일시스템 매핑**:

```
Category "dev"  → ~/dev/
Category "life" → ~/life/
Post slug       → ~/dev/nextjs-시작하기
about           → ~/about (하드코딩)
```

**TypeScript 타입**:

```typescript
interface Post {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  date: string;          // ISO 8601
  description: string;
  content: string;       // 마크다운 변환된 본문
  coverUrl?: string;
}

interface VirtualFS {
  currentPath: string;   // "~", "~/dev", "~/dev/nextjs-시작하기" 등
  directories: string[]; // 카테고리 목록
  files: Map<string, Post[]>; // 카테고리별 글 목록
}

interface CommandResult {
  type: 'text' | 'markdown' | 'error' | 'clear' | 'loading' | 'posts' | 'banner';
  content: string;
  isStreaming?: boolean;  // ask 명령어의 스트리밍 응답
  sources?: Array<{ title: string; slug: string }>;  // ask 명령어의 출처
}

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'banner';
  prompt?: string;       // "visitor@seunan.dev:~/dev$"
  command?: string;
  result?: CommandResult;
}
```

### API Design

**Next.js API Routes**:

| Route      | Method | 용도         |
| ---------- | ------ | ------------ |
| `/api/ask` | POST   | AI 질문 처리 |

```typescript
// POST /api/ask
// Request
{ question: string }

// Response (streaming)
{
  answer: string,
  sources: Array<{ title: string, slug: string, excerpt: string }>
}
```

**콘텐츠 로딩**:
- 빌드 시 `scripts/generate-posts-json.ts`가 `content/posts/*.md`를 파싱
- `gray-matter`로 프론트매터 추출, 본문은 마크다운 그대로 저장
- 생성된 `src/shared/generated/posts.json`에서 동기적으로 로드
- AI 검색: 제목, 설명, 본문, 태그에서 키워드 매칭

## UI/UX

### 터미널 윈도우

```
┌─ seunan.dev ─────────────────── ● ○ ○ ─┐
│                                         │
│  ███████╗███████╗██╗   ██╗███╗   ██╗   │
│  ██╔════╝██╔════╝██║   ██║████╗  ██║   │
│  ███████╗█████╗  ██║   ██║██╔██╗ ██║   │
│  ╚════██║██╔══╝  ██║   ██║██║╚██╗██║   │
│  ███████║███████╗╚██████╔╝██║ ╚████║   │
│  ╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝   │
│                                         │
│  Welcome to seunan.dev                  │
│  Type 'help' for available commands     │
│                                         │
│  visitor@seunan.dev:~$ █                │
│                                         │
└─────────────────────────────────────────┘
```

### Catpuccin Mocha 팔레트

| 용도              | 색상               | Hex     |
| ----------------- | ------------------ | ------- |
| Background (Base) | 어두운 배경        | #1e1e2e |
| Text              | 기본 텍스트        | #cdd6f4 |
| Prompt (Green)    | 프롬프트 user@host | #a6e3a1 |
| Prompt (Blue)     | 경로               | #89b4fa |
| Commands (Mauve)  | 입력 명령어        | #cba6f7 |
| Headings (Blue)   | 마크다운 제목      | #89b4fa |
| Code (Green)      | 코드 블록          | #a6e3a1 |
| Error (Red)       | 에러 메시지        | #f38ba8 |
| Warning (Yellow)  | 경고               | #f9e2af |
| Links (Sapphire)  | 링크               | #74c7ec |
| Muted (Overlay0)  | 주석/날짜          | #6c7086 |
| Surface           | 코드 블록 배경     | #313244 |
| Cursor            | 커서               | #f5e0dc |

### 명령어 상세

| 명령어    | 사용법                      | 동작                                                                                |
| --------- | --------------------------- | ----------------------------------------------------------------------------------- |
| `help`    | `help`                      | 사용 가능한 명령어 목록 표시                                                        |
| `banner`  | `banner`                    | ASCII 아트 배너 + 환영 메시지 다시 표시                                             |
| `ls`      | `ls`                        | 현재 디렉토리의 파일/폴더 목록. ~에서는 카테고리 + about, 카테고리 안에서는 글 목록 |
| `cd`      | `cd <dir>`, `cd ..`, `cd ~` | 디렉토리 이동                                                                       |
| `cat`     | `cat <slug>`                | 글 본문 표시 (마크다운 렌더링, 타이핑 애니메이션)                                   |
| `grep`    | `grep <keyword>`            | 전체 글에서 키워드 검색, 매칭된 글 목록 + 발췌문 표시                               |
| `ask`     | `ask "<question>"`          | AI에게 질문. 스트리밍 응답 + 출처 표시                                              |
| `about`   | `about`                     | 프로필 정보 표시 (이름, 직책, 경력, 기술 스택, 프로젝트, 소셜 링크)                 |
| `tags`    | `tags`                      | 전체 태그 목록 + 각 태그의 글 수 표시                                               |
| `whoami`  | `whoami`                    | "visitor" 표시 (이스터에그)                                                         |
| `history` | `history`                   | 입력한 명령어 히스토리 표시                                                         |
| `clear`   | `clear`                     | 화면 초기화, 프롬프트만 남김                                                        |

**Tab 자동완성**:
- 명령어 자동완성: `h` + Tab → `help`, `history` 후보 표시
- Slug 자동완성: `cat n` + Tab → `cat nextjs-시작하기`
- 디렉토리 자동완성: `cd d` + Tab → `cd dev`

**키보드 단축키**:
- `↑/↓`: 명령어 히스토리 탐색
- `Ctrl+L`: 화면 클리어
- `Ctrl+C`: 현재 입력 취소, 새 프롬프트

### ls 출력 형식

```
visitor@seunan.dev:~$ ls
drwxr-xr-x  dev/
drwxr-xr-x  life/
-rw-r--r--  about

visitor@seunan.dev:~$ cd dev
visitor@seunan.dev:~/dev$ ls
-rw-r--r--  nextjs-시작하기     2024-03-01  #nextjs #react
-rw-r--r--  react-패턴-정리     2024-02-15  #react #patterns
-rw-r--r--  typescript-tips     2024-02-01  #typescript
```

### 타이핑 애니메이션

- `cat` 명령어 결과에만 적용 (긴 콘텐츠)
- 속도: 문자당 5~10ms (빠르게, 느끼는 정도만)
- `ask` 명령어: 스트리밍 응답으로 자연스럽게 타이핑 효과
- `ls`, `help`, `tags` 등 짧은 출력: 즉시 표시
- 스크롤: 출력이 화면을 넘어가면 자동 스크롤

### Edge Cases

| 상황                   | 동작                                                            |
| ---------------------- | --------------------------------------------------------------- |
| 존재하지 않는 명령어   | `command not found: <cmd>. Type 'help' for available commands.` |
| 잘못된 경로 cd         | `cd: no such directory: <path>`                                 |
| 존재하지 않는 slug cat | `cat: <slug>: No such file`                                     |
| grep 결과 없음         | `grep: no results for "<keyword>"`                              |
| ask 실패 (API 에러)    | `ask: error connecting to AI. Try again later.`                 |
| Notion API 에러        | 캐시된 데이터 사용, 없으면 에러 메시지                          |
| 빈 카테고리            | `(empty directory)`                                             |
| 글이 0개               | 배너 + `No posts yet. Check back later!`                        |

### 모바일 간소화 UI

- 터미널 프레임 유지 (타이틀바, 배경색)
- 프롬프트 표시하되 직접 타이핑 대신:
  - 하단에 자주 쓰는 명령어 버튼 바: `ls` `cat` `ask` `about` `help`
  - 글 목록의 slug를 탭하면 `cat <slug>` 자동 실행
  - 검색 입력란 제공 (grep/ask용)
- 소프트 키보드로도 입력 가능하지만 버튼으로 대부분 해결
- 반응형 브레이크포인트: 768px 이하에서 간소화 모드 활성화

### SEO (SSR 대응)

**정적 페이지 전략**:
- `/posts/[slug]` 페이지를 `generateStaticParams()`로 빌드 타임에 정적 생성
- 크롤러와 일반 사용자 모두 `/posts/[slug]`에서 일반 HTML 페이지 접근 가능
- 메인 페이지(`/`)는 터미널 UI 전용
- User-Agent 기반 크롤러 감지 미들웨어 없음 (별도의 정적 페이지로 SEO 충족)

**메타데이터**:
- 글별 Open Graph (title, description, image from Cover)
- JSON-LD (BlogPosting schema)
- sitemap.xml (전체 발행된 글)
- robots.txt

## Implementation Plan

전체를 한 번에 구현하되, 의존성 순서대로:

### Step 1: 기반 구축
- [x] Catpuccin Mocha 테마 설정 (Tailwind CSS v4 `globals.css`)
- [x] 모노스페이스 폰트 설정 (D2Coding)
- [x] 사이트 설정 파일 (`shared/config/`)
- [x] 빌드 타임 마크다운 파싱 스크립트 (`scripts/generate-posts-json.ts`)

### Step 2: 데이터 레이어
- [x] Post entity 타입/API (`entities/post/`)
- [x] 가상 파일시스템 entity (`entities/file-system/`)
- [x] Command entity/파서 (`entities/command/`)
- [x] 빌드 타임 정적 JSON 생성으로 글 목록/본문 로드

### Step 3: 터미널 UI
- [x] 터미널 윈도우 컨테이너 (`widgets/terminal/`)
- [x] 프롬프트 컴포넌트 (`shared/ui/terminal-prompt`)
- [x] 커서 컴포넌트 (깜빡임 애니메이션)
- [x] 명령어 입력 feature (`features/command-input/`)
  - 텍스트 입력, Enter 실행
  - Tab 자동완성
  - ↑↓ 히스토리 탐색
  - Ctrl+L, Ctrl+C
- [x] 타이핑 애니메이션 출력 (`features/terminal-output/`)
- [x] 마크다운 렌더링 (터미널 스타일, Catpuccin 색상)
- [x] ASCII 아트 배너 (seunan.dev)

### Step 4: 명령어 구현
- [x] 명령어 실행기 (`features/command-executor/`)
- [x] `help` 명령어
- [x] `banner` 명령어
- [x] `ls` 명령어 (현재 경로 기반)
- [x] `cd` 명령어 (가상 파일시스템 이동)
- [x] `cat` 명령어 (글 본문 + 타이핑 애니메이션)
- [x] `grep` 명령어 (키워드 검색)
- [x] `about` 명령어 (프로필 표시)
- [x] `tags` 명령어
- [x] `whoami` 명령어
- [x] `history` 명령어
- [x] `clear` 명령어

### Step 5: AI 기능
- [x] Gemini API 클라이언트 설정 (`shared/api/gemini/`)
- [x] `/api/ask` API Route
- [x] `ask` 명령어 (command-executor에 통합)
- [x] 키워드 매칭 검색 → 관련 글 본문을 Gemini context로 전달
- [x] 응답 렌더링 + 출처 표시

### Step 6: SEO & 모바일
- [x] 정적 글 페이지 (`/posts/[slug]`, `generateStaticParams`)
- [x] 메타데이터 (Open Graph)
- [x] sitemap.xml, robots.txt
- [x] 모바일 간소화 UI (명령어 버튼 바)

### Step 7: 마무리
- [x] About 프로필 콘텐츠 작성
- [ ] 에러 처리 (모든 edge case)
- [ ] Vercel 배포 설정
- [ ] 성능 최적화 (폰트 로딩, 코드 스플리팅)

## Concerns & Tradeoffs

| Decision      | Options Considered                      | Chosen                      | Rationale                                           |
| ------------- | --------------------------------------- | --------------------------- | --------------------------------------------------- |
| UI 모드       | 듀얼(웹+터미널) / 터미널 전용           | 터미널 전용                 | 컨셉 순수성, SEO는 정적 페이지로 별도 대응          |
| 콘텐츠 소스   | Notion API / 로컬 마크다운 / CMS        | 로컬 마크다운 + 빌드 타임   | 외부 의존성 없음, 빠른 빌드, Git으로 버전 관리      |
| AI 검색       | RAG(벡터) / 키워드 / 전체 컨텍스트      | 키워드 매칭                 | 추가 인프라 불필요, 글 수가 적을 때 충분            |
| 렌더링 방식   | 마크다운 / 플레인텍스트 / ANSI          | 마크다운                    | 코드 하이라이팅, 이미지 등 리치 콘텐츠 지원         |
| 모바일        | 터미널 동일 / 간소화 / 미지원           | 간소화                      | 접근성 확보, 터미널 감성은 유지                     |
| 프롬프트      | user@host:path$ / host$ / ~$            | visitor@seunan.dev:~$       | 리눅스 터미널 느낌 극대화                           |
| SEO           | User-Agent 미들웨어 / 정적 페이지       | 정적 `/posts/[slug]` 페이지 | 미들웨어 복잡성 없이 동일한 SEO 효과                |

## Environment Variables

```bash
# .env.local
GROQ_API_KEY=gsk_xxx                # Gemini API Key
NEXT_PUBLIC_SITE_URL=https://seunan.dev
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=  # Google Search Console 인증 코드
```

## Decisions Made by Claude

- **폰트**: D2Coding (한국어 지원, 모노스페이스, 터미널에 최적화)
- **타이핑 속도**: 문자당 5~10ms — 사용감에 따라 조정
- **ls 출력**: Unix `ls -l` 스타일 (drwxr-xr-x, 날짜, 태그 포함)
- **콘텐츠 소스**: 로컬 마크다운 파일 + 빌드 타임 JSON 생성
- **AI 모델**: Gemini `gemini-3.1-flash-lite-preview`
- **SEO**: `generateStaticParams()`로 정적 페이지 생성

## Open Questions

- 글이 많아졌을 때 키워드 검색의 한계 → RAG으로 마이그레이션 시점 결정 필요
- `ask` 명령어의 스트리밍 응답 구현 여부 (현재 비스트리밍)
