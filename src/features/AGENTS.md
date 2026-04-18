<!-- Parent: ../AGENTS.md -->

# features — 사용자 기능 단위

각 슬라이스는 독립된 기능. 다른 feature를 import하지 않음 (cross-import 금지). 공유 로직은 `entities/` 또는 `shared/`로 내림.

## Slices

| Slice | 역할 | 핵심 파일 |
| --- | --- | --- |
| `ask` | AI 질문/답변 RAG 파이프라인 | `api/ask-graph.ts` (LangGraph), `api/semantic-search.ts` (Pinecone) |
| `command-input` | 터미널 입력창, 히스토리, 키보드 쇼트컷 | `ui/command-input.tsx` |
| `command-executor` | 파싱된 명령 실행 → 출력 생성 | `lib/commands.ts` |
| `terminal-output` | 실행 결과 렌더 (텍스트/링크/마크다운) | `ui/terminal-line-renderer.tsx` |

## Command System (요약)

사용자가 입력한 문자열을 `entities/command`의 파서가 `ParsedCommand`로 변환 → `features/command-executor`가 `VirtualFS`(entities/file-system) 상태를 참고해 `CommandResult` 생성 → `features/terminal-output`이 렌더.

지원 명령: `help`, `ls`, `cd`, `cat`, `grep`, `ask`, `!` (chat mode), `about`, `tags`, `whoami`, `date`, `history`, `clear`, `echo`, `banner`, `email`, `hostname`.

## Ask Feature (RAG)

1. 질문 sanitize (`app/api/ask/route.ts`)
2. `semanticSearch` — Pinecone index에서 top-k 포스트 slug 추출
3. `runAskGraph` — LangGraph `StateGraph`가 Gemini 호출, 컨텍스트로 해당 포스트 본문 주입
4. 스트리밍 응답 반환

모델은 `gemini-3.1-flash-lite-preview` (ask-graph.ts:19). 교체 시 해당 상수만 수정.

## For AI Agents

- 새 기능을 만들 때 UI/API/model을 각각 `ui/`, `api/`, `model/`, `lib/`로 분리.
- `api/`에는 반드시 `"use server"` 또는 `"server-only"` directive 확인 (ask의 `api/ask-graph.ts` 참고).
- 입력 클라이언트 컴포넌트는 파일 최상단 `"use client"` 필수.
- 공통 UI 패턴은 `shared/ui/`로, 공통 유틸은 `shared/lib/`로 이동.

<!-- MANUAL: -->
