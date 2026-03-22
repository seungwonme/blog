---
title: "터미널 블로그 제작 후기"
slug: building-terminal-blog
category: dev
tags: [blog, terminal, nextjs, claude-code, vibe-coding]
date: 2026-03-22
description: "seunan.dev 터미널 블로그를 3시간 만에 만든 과정. 왜 블로그를 만들었고, 왜 터미널 UI인지, 어떻게 개발했는지."
---

# 터미널 블로그 제작 후기

## 왜 블로그를 만들었나

블로그는 예전에도 있었다. 근데 안 썼다.

회고를 해야겠다는 생각, 겪은 실수나 깨달음을 어딘가에 적어둬야겠다는 생각은 계속 있었다.

추가로 이왕 기록할 거면, AI가 내 글을 쉽게 참조할 수 있으면 좋겠다고 생각했다. 요즘 작업 방식이 AI와 함께하는 게 기본이니까, 내 과거 기록을 컨텍스트로 줄 수 있으면 활용도가 올라간다.

## 왜 터미널 UI인가

사용성은 고려하지 않았다.

어차피 깃허브에 있는 마크다운 파일의 쇼케이스일 뿐이다. 웹은 그걸 보여주는 창이고, 그 창을 내가 좋아하는 형태로 만들면 되니까. Catppuccin Mocha 테마의 터미널 UI로 했다.

다 만들고 나니 이걸 보고 누군가 리눅스 명령어에 흥미를 느끼면 좋겠다는 생각은 들었다.

## 아키텍처

콘텐츠 저장소를 세 번 바꿨다.

**1차: Notion API** — 이미 노션을 쓰고 있어서 자연스러운 선택이었는데, AI가 참조하기에는 최악이었다. API call 제한, 복잡한 타입 구조.

**2차: Cloudflare R2 + D1** — Supabase 대신 새로운 스택으로 해보고 싶었다. 근데 AI에게 DB를 참조시키는 것도 결국 API 키와 호출 방법이 필요하다. 본질적으로 달라지는 게 없었다.

**3차: GitHub + 마크다운** — 마크다운 파일을 GitHub에 저장하고, 빌드 시 JSON으로 변환, Vercel로 정적 배포. AI가 내 글을 참조하려면 GitHub 레포를 읽으면 끝이다. API 키도 필요 없고, 마크다운이니 파싱도 쉽다.

## 기술 스택

| 기술 | 용도 |
|------|------|
| Next.js 16 + React 19 | 프레임워크 |
| TypeScript 5 | 타입 시스템 |
| Tailwind CSS v4 | 스타일링 (Catppuccin Mocha) |
| D2Coding | 모노스페이스 폰트 |
| gray-matter + react-markdown | 마크다운 파싱/렌더링 |
| Groq (Llama 3.3) | AI 답변 (`ask` 명령어) |
| Pinecone | 벡터 DB (시맨틱 검색) |
| Gemini Embedding 2 | 임베딩 생성 (3,072차원) |
| LangGraph | 질문 분류 + 조건부 RAG 라우팅 |
| Vercel | 배포 |

## 개발 과정

### 1. 스펙 정의

`/clarify`로 시작했다. 터미널 블로그 컨셉, 명령어 목록, 가상 파일시스템 구조, SEO 전략까지 코드 쓰기 전에 잡았다.

### 2. 보일러플레이트

[nextjs-boilerplate](https://github.com/seungwonme/nextjs-boilerplate)를 사용했다. FSD 아키텍처 구조, Biome 린터, pre-commit 훅 등 코드 품질을 위한 최소한의 설정이 들어있는 템플릿이다. 이걸 기반으로 시작하면 설정에 시간을 쓰지 않고 바로 기능 구현에 들어갈 수 있다.

### 3. 구현

기능 단위로 구현했다.

```
기반 구축 → 데이터 레이어 → 터미널 UI → 명령어 구현 → AI 기능 → SEO
```

터미널 명령어는 실제 리눅스와 비슷하게 만들었다.

- `ls` — Unix `ls -l` 스타일 출력
- `cd`, `cat`, `grep` — 가상 파일시스템 기반
- Tab 자동완성, `Ctrl+A/E/U/W`, 히스토리 탐색
- `!` 키로 AI 대화 모드 전환 (Claude Code에서 영감)

### 4. 검증

기능 하나가 끝나거나, 병렬로 검증 스킬을 계속 돌렸다.

- `/review` — 코드 리뷰
- `/seo-audit`, `/ai-seo` — SEO/GEO 검증
- `/find-skills` — 필요한 스킬 탐색

`/find-skills`는 책의 엑기스만 뽑아쓰는 느낌이었다. SEO가 필요하면 SEO 스킬을 찾아서 적용하고, 성능 검토가 필요하면 React best practices 스킬을 돌리고.

### 5. Lighthouse 결과

배포 후 Lighthouse로 측정했다.

| 카테고리 | 점수 |
|---------|------|
| Performance | 100 |
| Accessibility | 93 → 100 (input label 추가) |
| Best Practices | 100 |
| SEO | 100 |

주요 성능 지표:

- **FCP**: 0.3초
- **LCP**: 0.5초
- **TBT**: 0ms
- **CLS**: 0.002
- **Speed Index**: 0.8초

접근성에서 터미널 input에 `aria-label`이 빠져있어서 93점이 나왔었는데, 추가해서 해결했다. 나머지는 SSG 덕분에 거의 만점.

## 소요 시간

약 3시간. 새벽 12시부터 4시까지, 중간에 쉬면서.

까다롭기보다는 놀라웠다. 2023년부터 AI를 써왔는데, 3년 사이의 발전 속도가 말이 안 된다. 특히 최근 4개월간 소프트웨어 분야의 발전이 인상적이다.

## 설계 결정

| 결정 | 선택 | 이유 |
|------|------|------|
| UI | 터미널 전용 | SEO는 정적 페이지로 별도 대응 |
| 콘텐츠 | 마크다운 + 빌드 타임 JSON | AI 참조 용이, 외부 의존성 없음 |
| AI 검색 | Pinecone + LangGraph | 시맨틱 검색 + 조건부 RAG |
| SEO | 정적 `/posts/[slug]` 페이지 | URL 경로가 터미널 명령어로도 동작 |
| 404 | "command not found" | 터미널 컨셉 유지 |

## RAG 도입

### 키워드 검색의 한계

처음에는 단어 매칭으로 검색했다. 사용자 질문을 단어로 쪼개서 title, description, content에 `includes()`로 매칭하고 점수를 매기는 방식. 글이 1개일 때는 충분했는데, 의미 기반 검색이 안 된다. "블로그 어떻게 만들었어?"라고 물으면 "제작 후기" 글을 못 찾는다.

### 벡터 DB 선택: Pinecone

벡터 DB 후보를 비교했다.

| | Supabase pgvector | Upstash Vector | Pinecone |
|---|---|---|---|
| 무료 스토리지 | 500MB | vector×dimension ≤ 2억 | 2GB |
| 최대 차원 | 제한 없음 | 1,536 | 제한 없음 |
| 쿼리 한도 | - | 일 10K | 월 100만 읽기 |

Gemini Embedding 2의 기본 차원이 3,072인데, Upstash 무료 티어는 최대 1,536차원이라 축소가 필요했다. Pinecone은 차원 제한이 없어서 풀 차원 그대로 사용 가능. 2GB면 3,072차원 기준 약 8만 벡터, 개인 블로그에서는 충분하다.

### 임베딩: Gemini Embedding 2

임베딩 모델은 Gemini Embedding 2 (`gemini-embedding-2-preview`)를 선택했다. 무료 티어에서 100 RPM까지 지원하고, 3,072차원으로 품질도 괜찮다.

### LangGraph: 조건부 RAG

"안녕"이라고 인사해도 RAG 검색을 타는 문제가 있었다. LangGraph로 질문을 먼저 분류한 뒤 조건부로 RAG를 실행하도록 바꿨다.

```
질문 → [분류] → "rag" → [Pinecone 검색] → [답변 생성 + 소스]
              → "chat" → [일반 대화 답변]
```

분류는 Groq (Llama 3.3)로 "rag"/"chat" 중 하나를 반환하게 했다. 분류 호출이 하나 추가되지만, 불필요한 임베딩 API 호출과 Pinecone 쿼리를 아낄 수 있어서 전체적으로 효율적이다.

### 자동화: GitHub Actions

글이 추가/수정/삭제될 때마다 수동으로 임베딩을 업데이트하기 싫어서 GitHub Actions로 자동화했다.

- `content/posts/**` 파일이 변경된 push가 main에 올라오면 트리거
- 각 글의 콘텐츠를 SHA-256 해시로 비교, 변경된 글만 재임베딩
- 삭제된 글은 Pinecone에서 자동 제거
- 해시 캐시를 `actions/cache`로 유지해서 매번 전체를 다시 하지 않음

## 앞으로

나중에 AI 뉴스를 AI로 매일 자동 발행하는 구조를 만들 생각이다.

- `news` 명령어로 블로그에서 뉴스 구독
- 같은 콘텐츠를 오픈카톡방에 재활용
- 유튜브, 링크드인, 스레드, X 소재로 확장

블로그가 단순히 글을 읽는 곳이 아니라, 콘텐츠 허브가 되는 셈이다. 마크다운으로 한 번 쓰면 여러 채널로 퍼지는 구조.

## 마무리

마크다운으로 쓰고, GitHub에 올리고, 터미널로 보여준다. AI가 참조하기 쉽고, 내가 쓰기 편하다.

```bash
visitor@seunan.dev:~$ cat building-terminal-blog
# 끝.
```
