<!-- Parent: ../AGENTS.md -->

# src — FSD Source

Feature-Sliced Design 계층. 의존성 방향: `app → pages → widgets → features → entities → shared`. 역방향 및 같은 레이어 cross-import 금지.

## Layers

| Layer | 내용 |
| --- | --- |
| `app/` | providers, 전역 설정 (현재는 비어있음, 확장 지점) |
| `pages/home/` | 홈 페이지 컴포지션. `app/page.tsx`에서 default export로 재노출 |
| `widgets/terminal/` | 터미널 윈도우 UI 블록 (상단 바 + 입력 + 출력 + 배경) |
| `features/` | `ask`, `command-input`, `command-executor`, `terminal-output` |
| `entities/` | `command` (파서/타입), `file-system` (가상 FS), `post` (콘텐츠 소스) |
| `shared/` | `ui`, `lib`, `api` (gemini/pinecone), `hooks`, `generated` (posts.json) |

## Import Conventions

```typescript
// ✅ index.ts 경유
import { Button } from "@/shared/ui";
import { runAskGraph } from "@/features/ask";

// ❌ 내부 경로 직접 접근
import { Button } from "@/shared/ui/button";
```

각 슬라이스는 반드시 `index.ts` (public API)를 가진다. 새 슬라이스 추가 시 `index.ts`부터 만들 것.

## For AI Agents

- 같은 레이어 두 슬라이스가 같은 로직을 공유해야 하면 한 단계 아래 레이어로 내릴 것 (예: 두 feature가 공유 → entity나 shared로).
- `lint:fsd`는 이 구조를 강제. 위반 시 `pnpm lint:fsd`가 실패함.
- `shared/generated/posts.json`은 `pnpm predev`/`prebuild`에서 자동 생성되므로 수동 편집 금지.

## Subdirectories

| Dir | AGENTS.md |
| --- | --- |
| `features/` | `src/features/AGENTS.md` |
| `entities/` | `src/entities/AGENTS.md` |
| `widgets/` | (단일 슬라이스, 본 문서로 대체) |
| `shared/` | `src/shared/AGENTS.md` |

<!-- MANUAL: -->
