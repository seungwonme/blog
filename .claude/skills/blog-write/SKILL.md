---
name: blog-write
description: "블로그 글 작성. 인터뷰 기반으로 content/posts/에 마크다운 글을 생성. Use when user says '글 써줘', '블로그 글', 'blog post', '후기 작성', '회고 작성', '포스트 작성', '/blog-write', or wants to write a new blog post. Also triggers when discussing a topic and user wants to turn it into a blog post."
---

# Blog Write

`content/posts/`에 마크다운 블로그 글을 작성한다.

## 워크플로우

### 1. 맥락 수집

주제가 주어지면 관련 자료를 수집한다.

- 세션 히스토리: `python3 ~/.agents/shared/session-history/scripts/session_history.py`
- about: `content/about.md`
- 기존 글 확인: `content/posts/`
- 기존 글과 주제/톤이 겹치지 않는지 확인

### 2. 인터뷰

8~10개 질문으로 핵심을 뽑는다. 한 번에 많이 묻지 않는다.

질문 기준:

- 동기/배경
- 과정과 선택
- 결과/회고
- 기술 포인트 (AI가 나중에 참조할 구체적 정보)

세션 히스토리에서 사용자 행동을 미리 분석하여 질문에 반영한다. 이미 말한 내용을 다시 묻지 않는다.

### 3. 작성

프론트매터 — `assets/post-template.md` 참조.

작성 규칙:

- 톤: 담백하게. 핵심 기술 포인트는 구체적으로
- 대상: AI가 나중에 참조할 수 있도록 사실 위주
- 오그라드는 표현 자제 — 볼드 남발, 자화자찬, 과장 금지
- 제목은 간결하게
- 파일: `content/posts/{slug}.md` (UTF-8, 작성 후 `file -I`로 확인)

### 4. 피드백

작성 후 사용자에게 보여주고 피드백 반영.

## 카테고리

| 카테고리 | 용도                        |
| -------- | --------------------------- |
| dev      | 개발 (기술, 프로젝트, 도구) |
| life     | 일상, 생각                  |
| review   | 후기, 회고                  |
