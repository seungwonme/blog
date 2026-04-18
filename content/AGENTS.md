<!-- Parent: ../AGENTS.md -->

# content — 마크다운 소스

모든 블로그 콘텐츠의 원본. 빌드 시 `scripts/generate-posts-json.ts`가 `src/shared/generated/posts.json`으로 통합한다.

## Structure

| Path | 역할 |
| --- | --- |
| `posts/*.md` | 블로그 글. frontmatter `category`로 분류 (`dev`, `til` 등) |
| `digest/YYYY-MM-DD.md` | 일일 digest. `category: digest`, slug는 날짜 |
| `about.md` | About 페이지 본문 |
| `_private/` | 로컬 비공개 메모. **`.gitignore`됨, 커밋 금지** |

## Frontmatter

```yaml
---
title: "글 제목"
slug: "url-slug"            # 파일명과 일치 권장
category: "dev"             # posts: dev/til/... | digest: "digest"
tags: ["tag1", "tag2"]
date: "2026-04-18"
description: "메타 설명"
---
```

## For AI Agents

- 새 포스트 추가 후 `pnpm dev` 재시작 또는 `pnpm predev` 수동 실행 → `posts.json` 갱신.
- slug는 파일명과 일치시킬 것. 중복 slug는 generate 스크립트에서 덮어쓰기 발생.
- digest는 `daily-digest` 스킬의 하드 룰 준수 (Draft-ID, `###` 섹션 구조). 별도 스킬 문서 참고.
- `_private/`에 작성한 파일은 `posts.json`에 포함되지 않음 (generator scope: posts + digest + about.md only).
- 글 커밋 후 Pinecone 인덱스 동기화 필요 시: `pnpm upsert-embeddings`.

<!-- MANUAL: -->
