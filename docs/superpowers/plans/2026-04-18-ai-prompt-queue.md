# AI Prompt Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI 모드에서 스트리밍 응답을 기다리는 동안 다음 프롬프트를 미리 입력해 FIFO 큐에 적재하고, 응답이 끝나면 자동으로 순서대로 소비하는 기능을 추가한다.

**Architecture:** `TerminalWindow` 에 `promptQueue: string[]` state 를 두고, `useEffect([isProcessing, promptQueue])` 가 `!isProcessing && queue.length > 0` 조건에서 첫 항목을 dequeue 해 `handleCommand` 를 재진입시킨다. `CommandInput` 은 AI 모드에서 `disabled` 여도 타이핑/Enter 를 허용하고, Esc 는 input 이 비어있을 때만 queue pop 으로 동작한다. Queue 항목은 `CommandInput` 위쪽에 새 `PromptQueue` 컴포넌트로 표시한다.

**Tech Stack:** React 19, TypeScript, Tailwind v4 (Catppuccin 테마), FSD 아키텍처, Biome, Steiger.

**Test strategy:** 이 레포에는 자동화 테스트 프레임워크가 없다 (package.json `scripts` 에 `test` 없음). 대신 각 태스크 끝에 `pnpm lint`, `pnpm lint:fsd` 통과 + 수동 검증 스크립트로 대체한다. 마지막 Task 4 에서 전체 수동 검증 체크리스트를 돌린다.

**Spec reference:** `docs/superpowers/specs/2026-04-18-ai-prompt-queue-design.md`

---

## File Structure

| 변경 유형 | 경로 | 책임 |
| --- | --- | --- |
| 신규 | `src/features/command-input/ui/prompt-queue.tsx` | queued 프롬프트 목록을 `⏵ <text>` 형태로 렌더. 빈 배열이면 null. |
| 수정 | `src/features/command-input/index.ts` | `PromptQueue` public export 추가. |
| 수정 | `src/features/command-input/ui/command-input.tsx` | AI 모드 + disabled 일 때 타이핑 허용, Esc → queue pop 분기, queueSize 기반 hint. props 확장. |
| 수정 | `src/widgets/terminal/ui/terminal-window.tsx` | `promptQueue` state, drain effect, AI 모드 큐잉 분기, `PromptQueue` 렌더, 모드 전환 시 queue clear. |

---

### Task 1: `PromptQueue` 컴포넌트 생성

**Files:**
- Create: `src/features/command-input/ui/prompt-queue.tsx`
- Modify: `src/features/command-input/index.ts`

- [ ] **Step 1: `prompt-queue.tsx` 파일 작성**

`src/features/command-input/ui/prompt-queue.tsx` 생성:

```tsx
import { memo } from "react";

interface PromptQueueProps {
  items: string[];
}

export const PromptQueue = memo(function PromptQueue({
  items,
}: PromptQueueProps) {
  if (items.length === 0) return null;

  return (
    <div
      className="text-ctp-overlay1 font-mono text-sm mb-1"
      aria-label="Queued prompts"
      role="list"
    >
      {items.map((item, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: items are ephemeral queue snapshots, not persistent entities
          key={i}
          className="truncate"
          role="listitem"
        >
          <span className="inline-block w-4">⏵</span>
          {item}
        </div>
      ))}
    </div>
  );
});
```

- [ ] **Step 2: `index.ts` 에 export 추가**

`src/features/command-input/index.ts` 를 다음으로 교체:

```ts
export { CommandInput } from "./ui/command-input";
export { PromptQueue } from "./ui/prompt-queue";
```

- [ ] **Step 3: Lint 통과 확인**

Run: `pnpm lint && pnpm lint:fsd`
Expected: 둘 다 통과 (0 errors).

- [ ] **Step 4: 커밋**

```bash
git add src/features/command-input/ui/prompt-queue.tsx src/features/command-input/index.ts
git commit -m "feat(command-input): add PromptQueue component"
```

---

### Task 2: `CommandInput` 큐 연동

**Files:**
- Modify: `src/features/command-input/ui/command-input.tsx`

현재 파일에서 두 가지를 고친다:
1. `<input disabled={disabled}>` → AI 모드에서는 disabled 를 무시해 타이핑·Enter 허용.
2. Esc 동작에 "input 비어있고 queue 있으면 pop" 분기 추가.
3. 입력창 아래 hint 영역에서 `queueSize > 0` 이면 counter 표시.

- [ ] **Step 1: Props 인터페이스 확장**

`src/features/command-input/ui/command-input.tsx` 의 `CommandInputProps` 인터페이스를 다음으로 교체:

```tsx
interface CommandInputProps {
  currentPath: string;
  onSubmit: (command: string) => void;
  history: string[];
  completionContext: CompletionContext;
  disabled?: boolean;
  isAiMode?: boolean;
  onToggleAiMode?: () => void;
  onLayoutChange?: () => void;
  queueSize?: number;
  onEscapePopQueue?: () => void;
}
```

그리고 함수 시그니처(component destructure) 도 맞춰서 새 props 를 받도록 수정:

```tsx
export function CommandInput({
  currentPath,
  onSubmit,
  history,
  completionContext,
  disabled = false,
  isAiMode = false,
  onToggleAiMode,
  onLayoutChange,
  queueSize = 0,
  onEscapePopQueue,
}: CommandInputProps) {
```

- [ ] **Step 2: AI 모드에서는 disabled 무시하고 타이핑 허용**

`<input>` 엘리먼트의 `disabled` prop 을 다음처럼 바꾼다 (현재 약 line 450 `disabled={disabled}`):

```tsx
disabled={disabled && !isAiMode}
```

그리고 `useEffect(() => { if (!disabled) inputRef.current?.focus(); }, [disabled]);` 부분도 AI 모드에서 포커스 유지하도록:

```tsx
useEffect(() => {
  if (!disabled || isAiMode) {
    inputRef.current?.focus();
  }
}, [disabled, isAiMode]);
```

커서 렌더링(`{!disabled && <TerminalCursor />}`)도 AI 모드 + disabled 에선 커서를 계속 보여줘야 하니:

```tsx
{(!disabled || isAiMode) && <TerminalCursor />}
```

- [ ] **Step 3: Esc 핸들러에 queue pop 분기 추가**

기존 `handleKeyDown` 안에는 두 군데에 Esc 처리 로직이 있다:
1. slash menu 닫기 (`if (showSlashMenu) { ... if (e.key === "Escape") ... }`)
2. completion cycle 복원 (`if (e.key === "Escape" && cycleIndex >= 0) { ... }`)

이 두 분기보다 **뒤쪽** (즉 slash menu·cycle 에 해당 안 되는 일반 Esc 상황), 그리고 "Arrow Up: previous history" 분기보다 **앞쪽**에 새 분기를 삽입한다. 구체적으로는 "Arrow keys while cycling" (`if (cycleIndex >= 0 && completions.length > 0 && (... ArrowLeft ...))`) 블록 **직후**, `if (e.key === "ArrowUp") { ... history ... }` **직전** 위치:

```tsx
// Esc (AI 모드, input 비어있음, queue 있음) → queue pop
if (
  e.key === "Escape" &&
  isAiMode &&
  input === "" &&
  onEscapePopQueue
) {
  e.preventDefault();
  onEscapePopQueue();
  return;
}
```

`useCallback` 의존성 배열에 `onEscapePopQueue` 추가.

- [ ] **Step 4: Queue counter hint 추가**

파일 하단 `{/* Hint */}` 영역을 다음으로 교체:

```tsx
{/* Hint */}
{!showSlashMenu && queueSize > 0 && !input && (
  <div className="text-ctp-overlay0 text-xs mt-1">
    {queueSize} queued · esc to cancel last
  </div>
)}
{!showSlashMenu && queueSize === 0 && !input && !disabled && (
  <div className="text-ctp-overlay0 text-xs mt-1">
    {isAiMode ? "! for terminal mode · / for commands" : "! for AI mode"}
  </div>
)}
```

주의: 기존 `!disabled` 조건을 queue 표시 쪽에서는 제거해야 함. AI 모드 + disabled 상태에서도 queue counter 는 보여야 하기 때문.

- [ ] **Step 5: Lint 통과 확인**

Run: `pnpm lint && pnpm lint:fsd`
Expected: 둘 다 통과.

- [ ] **Step 6: 커밋**

```bash
git add src/features/command-input/ui/command-input.tsx
git commit -m "feat(command-input): allow typing during AI streaming and handle queue Esc"
```

---

### Task 3: `TerminalWindow` 에 queue state + drain effect

**Files:**
- Modify: `src/widgets/terminal/ui/terminal-window.tsx`

- [ ] **Step 1: `PromptQueue` import 추가**

파일 상단의 `CommandInput` import 줄을 다음으로 교체:

```tsx
import { CommandInput, PromptQueue } from "@/features/command-input";
```

- [ ] **Step 2: `promptQueue` state 추가**

`TerminalWindow` 컴포넌트 내부, `isAiMode` state 선언 바로 아래에 추가:

```tsx
const [promptQueue, setPromptQueue] = useState<string[]>([]);
```

- [ ] **Step 3: `handleCommand` 의 AI 분기에 큐잉 로직 추가**

현재 `handleCommand` 안 AI 모드 분기 최상단 (AI 모드라는 `if (isAiMode) {` 블록 진입 직후, `addLine` 호출 **전**) 에 다음을 삽입:

```tsx
// AI 스트리밍 중이면 큐에 적재만 하고 반환 (dequeue 시점에 라인 렌더)
if (isProcessing) {
  setPromptQueue((prev) => [...prev, input]);
  return;
}
```

`useCallback` 의존성 배열에 `isProcessing` 추가.

- [ ] **Step 4: Drain effect 추가 (StrictMode 방어 포함)**

`handleCommand` 정의 **아래**, `initialCommandExecuted` useEffect 바로 **앞**에 추가:

```tsx
// StrictMode/dev double-invoke 에서 같은 next 가 두 번 실행되지 않도록 가드
const drainingRef = useRef(false);

// Drain: AI 응답 종료 or 동기 슬래시 처리 후, 큐 첫 항목을 자동 소비
useEffect(() => {
  if (drainingRef.current) return;
  if (!isProcessing && promptQueue.length > 0) {
    drainingRef.current = true;
    const next = promptQueue[0];
    setPromptQueue((prev) => prev.slice(1));
    handleCommand(next);
    drainingRef.current = false;
  }
}, [isProcessing, promptQueue, handleCommand]);
```

`useRef` 가 아직 import 에 없으면 `import { useCallback, useEffect, useMemo, useRef, useState } from "react";` 확인 (현재 파일에 이미 있음).

- [ ] **Step 5: `toggleAiMode` 에서 queue clear**

현재:

```tsx
const toggleAiMode = useCallback(() => {
  setIsAiMode((prev) => !prev);
}, []);
```

다음으로 교체:

```tsx
const toggleAiMode = useCallback(() => {
  setIsAiMode((prev) => !prev);
  setPromptQueue([]);
}, []);
```

- [ ] **Step 6: `popQueue` 핸들러 추가 후 `CommandInput` 에 전달**

`toggleAiMode` 바로 아래에 추가:

```tsx
const popQueue = useCallback(() => {
  setPromptQueue((prev) => prev.slice(0, -1));
}, []);
```

그리고 JSX 의 `<CommandInput ... />` 부분에 `PromptQueue` 를 **위쪽**으로 끼워 넣고, 새 props 도 전달. 현재:

```tsx
<CommandInput
  currentPath={currentPath}
  onSubmit={handleCommand}
  history={commandHistory}
  completionContext={completionContext}
  disabled={isProcessing}
  isAiMode={isAiMode}
  onToggleAiMode={toggleAiMode}
  onLayoutChange={scrollToBottom}
/>
```

다음으로 교체:

```tsx
{isAiMode && <PromptQueue items={promptQueue} />}
<CommandInput
  currentPath={currentPath}
  onSubmit={handleCommand}
  history={commandHistory}
  completionContext={completionContext}
  disabled={isProcessing}
  isAiMode={isAiMode}
  onToggleAiMode={toggleAiMode}
  onLayoutChange={scrollToBottom}
  queueSize={promptQueue.length}
  onEscapePopQueue={popQueue}
/>
```

- [ ] **Step 7: Lint 통과 확인**

Run: `pnpm lint && pnpm lint:fsd`
Expected: 둘 다 통과. steiger 가 cross-layer 위반을 걸지 않는지 특히 확인.

- [ ] **Step 8: 타입체크 (build 일부 실행)**

Run: `pnpm dlx tsc --noEmit`
Expected: 0 errors.

(`tsconfig.json` 이 Next.js 기본 설정을 쓰므로 `--noEmit` 으로 타입만 검증. 시간 오래 걸리면 생략 가능.)

- [ ] **Step 9: 커밋**

```bash
git add src/widgets/terminal/ui/terminal-window.tsx
git commit -m "feat(terminal): wire AI prompt queue with drain effect"
```

---

### Task 4: 수동 검증

**Files:** 변경 없음. 오직 검증.

- [ ] **Step 1: 개발 서버 기동**

Run: `pnpm dev`
Expected: `http://localhost:3000` 에서 터미널 UI 정상 로드.

- [ ] **Step 2: 시나리오 A — 기본 큐잉 + 자동 drain**

1. `!` 입력 → AI 모드로 전환 확인 (프롬프트가 `ai ~` 로 바뀜).
2. 긴 질문 A (예: `블로그 전체 글을 요약해줘`) → Enter. 스트리밍 시작 확인.
3. 스트리밍 중 `질문 B` → Enter. 입력창 위에 `⏵ 질문 B` 표시되고 counter `1 queued · esc to cancel last` 노출 확인.
4. 추가로 `질문 C` → Enter. `⏵ 질문 B`, `⏵ 질문 C` 가 순서대로 위아래로 표시, counter `2 queued` 확인.
5. A 스트리밍 완료 → 자동으로 B 가 `ai ~ 질문 B` 로 찍히고 응답 시작, queue 에는 `⏵ 질문 C` 만 남음 (counter `1 queued`).
6. B 완료 → C 자동 실행, queue empty, counter 사라지고 기본 hint 복귀.

**Pass 기준:** 모든 큐 항목이 순서대로 실행되고, 각 실행마다 user input 라인이 terminal output 에 정상 기록된다.

- [ ] **Step 3: 시나리오 B — Esc 로 마지막 항목 pop**

1. AI 모드, 질문 A 스트리밍 시작.
2. 질문 B, C 연속 Enter.
3. 입력창이 비어있는 상태에서 Esc → `⏵ 질문 C` 사라짐, counter `1 queued` 확인.
4. 한 번 더 Esc → `⏵ 질문 B` 사라짐, counter 사라짐.
5. A 완료 후 queue 가 비어있으므로 추가 실행 없음.

**Pass 기준:** 입력창에 텍스트가 있는 상태에서는 Esc 가 input 만 비우고 queue 는 건드리지 않는다 (별도 검증 4번에서 확인).

- [ ] **Step 4: 시나리오 C — input 과 queue 공존 시 Esc 우선순위**

1. AI 모드, 질문 A 스트리밍 시작.
2. 질문 B Enter → queue 에 1 적재.
3. 이제 입력창에 `타이핑 중...` 을 Enter 누르지 않고 입력.
4. Esc → 입력창의 `타이핑 중...` 만 지워지고 queue 의 `⏵ 질문 B` 는 유지되어야 함.

**Pass 기준:** `input === ""` 일 때만 queue pop 으로 동작.

- [ ] **Step 5: 시나리오 D — 슬래시 커맨드 큐잉**

1. AI 모드, 긴 질문 A 스트리밍 시작.
2. `/clear` Enter → queue 에 적재.
3. `이전 대화 참고해서 답해줘` Enter → queue 에 적재.
4. A 완료 → `/clear` 출력 (`Conversation history cleared.`) + chatHistory 리셋. 바로 이어서 마지막 질문 실행.
5. 그 응답이 끝난 후 `/context` 로 `Conversation turns: 1` 확인 (2 번째 질문 + 응답이 새 세션의 첫 턴).

**Pass 기준:** 동기 슬래시 커맨드도 FIFO 순서대로 소비되며, `/clear` 로 history 가 리셋된 뒤 다음 항목이 새 세션에서 실행된다.

- [ ] **Step 6: 시나리오 E — 모드 전환 시 queue clear**

1. AI 모드, 질문 A 스트리밍 시작.
2. 질문 B, C 연속 Enter → queue 에 2 적재.
3. `!` 입력 → 터미널 모드로 전환, queue UI 즉시 사라짐 확인.
4. 다시 `!` → AI 모드 복귀, queue 는 비어있음 확인 (이전 B, C 는 drop 됐어야 함).

**Pass 기준:** 모드 전환 시 queue 가 `[]` 로 리셋된다.

- [ ] **Step 7: 시나리오 F — 스트리밍 에러 후 drain 정상 작동**

1. AI 모드, 질문 A Enter 로 스트리밍 시작.
2. 질문 B Enter 로 queue 적재.
3. Chrome DevTools Network 탭 → Offline 체크 (또는 서버 강제 종료).
4. 진행 중이던 요청이 catch 분기로 에러 라인 출력.
5. Network 온라인 복구 전/후 관계없이, queue 의 B 가 자동으로 dequeue 되어 실행 시도됨 (B 도 같은 이유로 실패할 수 있으나, drain 로직은 호출되어야 함).

**Pass 기준:** 에러 발생 후에도 `setIsProcessing(false)` 가 호출되어 drain effect 가 다음 항목을 소비한다.

- [ ] **Step 8: `pnpm build` 검증**

Run: `pnpm build`
Expected: 빌드 성공, 에러 없음.

- [ ] **Step 9: 최종 커밋 (검증 산출물 없음)**

검증만 하는 단계라 별도 커밋 불필요. 단, 검증 중 발견한 버그가 있으면 해당 Task 로 돌아가 수정 후 재검증.

---

## Verification Checklist (summary)

| 항목 | 통과 여부 |
| --- | --- |
| `pnpm lint` 통과 | ⬜ |
| `pnpm lint:fsd` 통과 | ⬜ |
| `pnpm build` 통과 | ⬜ |
| 시나리오 A (기본 drain) | ⬜ |
| 시나리오 B (Esc pop) | ⬜ |
| 시나리오 C (input 우선순위) | ⬜ |
| 시나리오 D (슬래시 큐잉) | ⬜ |
| 시나리오 E (모드 전환 clear) | ⬜ |
| 시나리오 F (에러 후 drain) | ⬜ |

---

## Out of scope (후속)

- `localStorage` 로 queue 영속화.
- `MobileCommandBar` 버튼 UI 에서의 queue 적재 (현재 버튼 기반이라 별 설계 필요).
- Queue 항목 편집·재정렬 UI.
