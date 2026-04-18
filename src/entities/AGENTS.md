<!-- Parent: ../AGENTS.md -->

# entities — 도메인 개체

비즈니스 도메인의 최소 단위. features가 조합해서 쓴다. entity 간 cross-import 금지 — 필요 시 구조적 최소 타입으로 decouple (file-system의 `FileSystemEntry` 패턴 참고).

## Slices

| Slice | 역할 |
| --- | --- |
| `command` | 명령어 파서·타입 (`ParsedCommand`, `CommandResult`) |
| `file-system` | 가상 파일시스템 (`VirtualFS`, `resolvePath`, `buildFileSystem`). 포스트를 카테고리별 디렉토리로 표현 |
| `post` | 블로그 콘텐츠 접근 (`getPosts`, `searchPosts`, `getAboutContent`). `shared/generated/posts.json`을 소스로 사용 |

## Decoupling Pattern

`file-system`은 `post`를 직접 참조하지 않고 구조적 타입으로 받는다:

```typescript
// entities/file-system/model/virtual-fs.ts
export interface FileSystemEntry {
  slug: string;
  title: string;
  category: string;
}
export function buildFileSystem<T extends FileSystemEntry>(entries: T[]): VirtualFS<T>
```

`PostMeta`는 이 shape를 만족하므로 `VirtualFS<PostMeta>`로 인스턴스화 가능. 같은 레이어 결합 회피.

## For AI Agents

- 새 entity 추가 시 `index.ts`에 public API만 노출.
- 다른 entity를 참조해야 한다면 구조적 타입(interface)으로 받는 함수 시그니처로 만들거나, 공통 타입을 `shared/`로 이동.
- `post` 슬라이스는 빌드 타임 JSON에 의존. 런타임 DB 조회가 필요해지면 `api/content-source.ts`를 교체.

<!-- MANUAL: -->
