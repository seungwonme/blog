# AI Prompt Queue Design

- **Date**: 2026-04-18
- **Scope**: `src/widgets/terminal/ui/terminal-window.tsx`, `src/features/command-input/`
- **Mode**: AI chat mode only (terminal mode 제외)

## Problem

현재 블로그 터미널의 AI chat 모드에서 `/api/ask` 스트리밍이 끝날 때까지 `CommandInput`이 `disabled` 상태가 된다 (widgets/terminal/ui/terminal-window.tsx:442). 사용자는 응답을 다 본 뒤에야 다음 질문을 타이핑할 수 있다.

Claude Code 터미널 UI처럼 **응답을 기다리는 동안 다음 프롬프트를 미리 입력해 큐에 적재**하고, 응답이 끝나면 자동으로 순서대로 소비되도록 만든다.

## Goals

- AI 모드에서 응답 스트리밍 중에도 타이핑/Enter 가능.
- Enter 입력은 FIFO 큐에 push 되며, 스트리밍 종료 시 자동으로 dequeue → 다음 요청 실행.
- 큐 상태를 입력창 위에 시각적으로 노출 (Claude Code와 동일한 감각).
- Esc로 마지막 큐 항목을 pop (입력창에 텍스트가 있으면 기존대로 텍스트만 비움).

## Non-goals

- Terminal 모드 (`cat`, `ask` 단발 명령) 큐잉 — 스코프 밖.
- 큐 항목 중간 편집/재정렬.
- `MobileCommandBar` 버튼 UI 큐잉 — 현재 스코프 제외.
- 큐 영속화 (새로고침·세션 넘어서 유지).

## Behavior

### Queue lifecycle

```
Enter (AI 모드, input 비어있지 않음)
├─ isProcessing === false → 기존대로 즉시 handleAsk 호출
└─ isProcessing === true  → promptQueue.push(input); input 초기화

AI 응답 종료 또는 동기 슬래시 커맨드 처리 후
└─ useEffect([isProcessing, promptQueue]) 가 감지
   └─ isProcessing === false && queue.length > 0 이면
      queue.shift() 결과로 setPromptQueue 갱신 + handleCommand(next) 호출
      · 다음 항목이 AI 요청이면 handleCommand 내부에서 setIsProcessing(true)
        → 효과 재실행 조건 끊김, handleAsk 종료 시 다시 트리거
      · 다음 항목이 동기 슬래시 커맨드면 isProcessing 변동 없이 반환
        → queue 변화로 effect 재실행, 다음 항목 계속 drain
      · queue 비면 멈춤

Esc (AI 모드)
├─ input.length > 0           → 기존대로 input 비움 (queue 건드리지 않음)
├─ input 비어있음 + queue 있음 → queue.pop()
└─ input 비어있음 + queue 없음 → 무시
```

### 슬래시 커맨드 큐잉

`/clear`, `/status`, `/context`, `/help`도 queue에 담긴다. 응답 스트리밍 중에 `/status` 결과가 스트리밍 라인 아래로 끼어드는 시각적 혼란을 막고, `긴 ask → /clear → 새 ask` 같은 플로우의 순서를 보존하기 위함.

### 모드 전환

AI → Terminal 전환 (`!`) 시 `promptQueue`를 전부 비운다. 큐는 AI 맥락의 상태이므로 다른 맥락으로 끌고 가지 않는다. Terminal → AI 복귀 시 queue는 비어있는 상태로 시작.

### Edge cases

| 상황 | 동작 |
| --- | --- |
| 스트리밍 중 에러 (fetch 실패 등) | `catch`에서도 `setIsProcessing(false)` 가 호출되므로 queue drain 정상 작동. 다음 항목 실행. |
| drain 도중 사용자가 추가로 큐잉 | 재귀 소비 구조라 자연스럽게 이어짐. |
| `/clear` 가 큐 중간에 있음 | dequeue 시 `chatHistoryRef.current = []`, `sessionIdRef.current = crypto.randomUUID()` 만 즉시 갱신 후 다음 항목 계속. |
| 큐 가득 찬 상태에서 또 Enter | 제한 없음. Claude Code와 동일하게 상한을 두지 않음. |

## UI

### 배치

```
┌ terminal output ─────────────────────────
│ ...
│ ai ~ 이전 질문
│ 스트리밍된 답변...
│
│   ⏵ 다음 질문 미리 입력한 거
│   ⏵ 그 다음 질문
│ ai ~ ▎|                  ← CommandInput
│   2 queued · esc to cancel last
└──────────────────────────────────────────
```

### 구성

- **Queue 리스트** (신규 컴포넌트 `prompt-queue.tsx`)
  - `CommandInput` 바로 **위**에 렌더.
  - 각 항목: `  ⏵ <text>`, 색상 `text-ctp-overlay1`, `font-mono text-sm`.
  - 오래된 항목이 위, 최신이 아래 (FIFO 시각적 정합).
- **Counter hint** (`CommandInput` 내부 기존 hint 영역 재활용)
  - `CommandInput` 아래, 현재 `! for terminal mode · / for commands` 힌트가 나오는 자리.
  - queue.length > 0 일 때: `${queue.length} queued · esc to cancel last`, 색상 `text-ctp-overlay0`.
  - queue.length === 0 일 때: 기존 힌트 유지.
- **입력창 placeholder**
  - 변경하지 않음. 기존 `"Ask anything..."` 유지 (Claude Code도 placeholder는 건드리지 않음).

### 스타일 상세

| 요소 | 클래스 | 비고 |
| --- | --- | --- |
| Queue 리스트 컨테이너 | `text-ctp-overlay1 font-mono text-sm` | `CommandInput` 위쪽 |
| Queue 항목 prefix | `⏵ ` (문자 그대로) | 2칸 들여쓰기 |
| Counter hint | `text-ctp-overlay0 text-xs` | 기존 hint 자리 |

## Architecture

### 상태 위치

- `promptQueue: string[]` — `TerminalWindow` 내부 `useState`.
  - Ref 대신 state 이유: 큐 변화가 UI 렌더에 직결됨 + drain 트리거에 의존.
- 기존 `isProcessing` 그대로 사용.
- Drain은 `useEffect(() => { ... }, [isProcessing, promptQueue])` 로 구현.
  - 조건: `!isProcessing && promptQueue.length > 0` → 첫 항목 shift 후 `handleCommand(next)` 호출.
  - 동기 슬래시 커맨드도 queue 상태 변화로 자동 연속 drain (위 lifecycle 참고).

### 파일 변경

**수정**
- `src/widgets/terminal/ui/terminal-window.tsx`
  - `promptQueue` state 추가.
  - `handleCommand` 내 AI 분기: `isProcessing === true` 이면 `setPromptQueue(prev => [...prev, input])` 후 early return. 이때 input 라인은 terminal output에 즉시 찍지 **않는다** (dequeue 시점에 찍음).
  - Drain effect: `useEffect(() => { if (!isProcessing && promptQueue.length > 0) { const [next, ...rest] = promptQueue; setPromptQueue(rest); handleCommand(next); } }, [isProcessing, promptQueue, handleCommand])`. 기존 `setIsProcessing(false)` 호출부는 손대지 않음 — effect 가 상태 변화를 관찰해서 자동으로 drain.
  - `toggleAiMode` 에서 `setPromptQueue([])` 호출.
  - `onEscapePopQueue` prop 을 `CommandInput` 에 전달 (input 비어있을 때 queue pop).
  - `promptQueue` 를 `CommandInput` 위쪽에 `PromptQueue` 컴포넌트로 렌더.

- `src/features/command-input/ui/command-input.tsx`
  - `disabled` prop 처리 변경: `isAiMode && disabled` 인 경우 input element 자체는 `disabled={false}` 로 유지 (타이핑/Enter 허용). 단순 `disabled={disabled}` → `disabled={disabled && !isAiMode}`.
  - `onSubmit` 호출 부는 변경 없음 — 상위 `handleCommand` 에서 queue 분기 처리.
  - Esc 핸들러에 분기 추가: `input === ""` 이고 `onEscapePopQueue` 가 정의되어 있으면 호출.
  - Props 추가: `onEscapePopQueue?: () => void`, `queueSize?: number` (counter hint 렌더용).
  - 하단 힌트 로직 수정: `queueSize > 0` 일 때 counter hint 우선 표시.

**신규**
- `src/features/command-input/ui/prompt-queue.tsx`
  - Props: `items: string[]`.
  - `items.length === 0` 이면 null 반환.
  - FSD 관례상 `command-input` feature 내에 두며, `index.ts` 에서 export.

### 데이터 흐름

```
┌───────────────────────────────────────┐
│ TerminalWindow                        │
│                                       │
│  promptQueue ─────────► PromptQueue   │
│     ▲    │             (표시만)        │
│     │    └──► drain effect            │
│     │        (!isProcessing &&        │
│     │         queue.length > 0        │
│     │         → handleCommand(next))  │
│     │                                 │
│     │  handleCommand ──► CommandInput │
│     │    (AI + isProc   │             │
│     │     → push queue) │             │
│     │                   │ Enter       │
│     │                   ▼             │
│     │           onSubmit(input)       │
│     │                                 │
│     └─── onEscapePopQueue ◄─── Esc    │
│           (input 비어있을 때)          │
└───────────────────────────────────────┘
```

## Verification

이 레포에는 현재 자동화 테스트 프레임워크가 없다 (package.json 기준 `test` 스크립트 없음). 수동 검증으로 대신한다.

**검증 체크리스트**
1. `pnpm dev` 로 띄운 후 `!` 로 AI 모드 진입.
2. 긴 질문 A 전송 → 스트리밍 시작 확인.
3. 스트리밍 중 질문 B, C 를 연속 Enter → 입력창 위에 `  ⏵ B`, `  ⏵ C` 표시 + 하단에 `2 queued · esc to cancel last` 확인.
4. 그 상태에서 Esc → `  ⏵ C` 제거, counter `1 queued` 로 감소 확인.
5. A 스트리밍 완료 → 자동으로 B 실행 (terminal output 에 `ai ~ B` 라인 찍히고 응답 시작).
6. B 실행 중 `/clear` 를 큐잉 → B 끝나면 `/clear` 결과 출력 + `chatHistoryRef` 비움 확인 (`/context` 로 conversation turns = 0 검증).
7. 큐가 있는 상태에서 `!` 로 터미널 모드 전환 → queue UI 즉시 사라지는지 확인. 다시 `!` 로 AI 복귀 시 queue 비어있음 확인.
8. 스트리밍 중 네트워크 강제 종료 (devtools offline) → 에러 라인 출력 후에도 queue 의 다음 항목이 정상 drain 되는지 확인.
9. `pnpm lint`, `pnpm lint:fsd` 통과.

## Out of scope / Follow-ups

- 큐 영속화 (localStorage) — 새로고침 시 유실. 필요 시 후속.
- 모바일 `MobileCommandBar` 큐잉 — 현재 UI 가 버튼 기반이라 별도 설계 필요.
- 큐 항목 편집/재정렬 — Claude Code 도 미지원. 도입 시 별 spec.
