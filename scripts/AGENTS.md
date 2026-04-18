<!-- Parent: ../AGENTS.md -->

# scripts — 빌드/ETL

빌드 타임 콘텐츠 파이프라인과 벡터 DB 업서트.

## Files

| File | 실행 시점 | 역할 |
| --- | --- | --- |
| `generate-posts-json.ts` | `predev`, `prebuild` 자동 실행 | `content/posts` + `content/digest` + `content/about.md` → `src/shared/generated/posts.json` |
| `upsert-embeddings.ts` | 수동 (`pnpm upsert-embeddings`) | 마크다운 콘텐츠를 Gemini로 임베딩, Pinecone 인덱스에 업서트 |

## generate-posts-json

- `gray-matter`로 frontmatter 파싱
- `content/_private/`는 읽지 않음 (경로 하드코딩)
- 출력 shape: `{ posts: PostEntry[], digests: DigestEntry[], about: string, generatedAt: string }`
- 스크립트 수정 시 `src/entities/post/api/content-source.ts`의 consumer 타입도 함께 점검

## upsert-embeddings

- `GEMINI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX` 환경변수 필요
- 콘텐츠 수정 후 검색 품질 유지하려면 수동 실행
- CI에서 자동화 시 post 추가 → 임베딩 업데이트 파이프라인 구축 지점

## For AI Agents

- `tsx`로 실행 (`bunx tsx scripts/...`). Node API 사용 가능, 하지만 클라이언트 번들에는 포함 안 됨.
- 새 스크립트 추가 시 `package.json`의 `scripts`에 등록.
- 마크다운 스키마를 바꾸면 세 곳을 동시에 수정: 이 스크립트 + `entities/post/model/types.ts` + 기존 콘텐츠 마이그레이션.

<!-- MANUAL: -->
