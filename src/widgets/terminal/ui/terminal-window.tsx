"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CommandResult, TerminalLine } from "@/entities/command";
import { parseCommand } from "@/entities/command";
import { buildFileSystem } from "@/entities/file-system";
import type { PostMeta } from "@/entities/post";
import { executeCommand } from "@/features/command-executor";
import { CommandInput, PromptQueue } from "@/features/command-input";
import { TerminalLineRenderer } from "@/features/terminal-output";
import { ASCII_BANNER } from "@/shared/lib/ascii-banner";
import { MobileCommandBar } from "./mobile-command-bar";
import { TerminalBackground } from "./terminal-background";

interface TerminalWindowProps {
  posts: PostMeta[];
  aboutContent: string;
  initialCommand?: string;
  /** Slug → markdown map for server-preloaded post bodies. Avoids the /api/posts fetch when the slug is already known. */
  preloadedContent?: Record<string, string>;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_LINES = 500;

function createInitialLines(): TerminalLine[] {
  return [
    {
      id: "init-input",
      type: "input",
      prompt: "~",
      command: "banner",
    },
    {
      id: "init-banner",
      type: "banner",
      result: { type: "banner", content: ASCII_BANNER },
    },
  ];
}

function executeAiSlashCommand(
  cmd: string,
  chatHistory: ChatMessage[],
): { result: CommandResult; clearHistory?: boolean } | null {
  switch (cmd) {
    case "/status":
      return {
        result: {
          type: "text",
          content: `Model: gemini-3.1-flash-lite (Google)\nMode: AI chat\nConversation turns: ${Math.floor(chatHistory.length / 2)}`,
        },
      };
    case "/clear":
      return {
        clearHistory: true,
        result: {
          type: "text",
          content: "Conversation history cleared.",
        },
      };
    case "/context": {
      const contextChars = chatHistory.reduce(
        (sum, msg) => sum + msg.content.length,
        0,
      );
      const contextTokensEstimate = Math.ceil(contextChars / 4);
      return {
        result: {
          type: "text",
          content: `Conversation turns: ${Math.floor(chatHistory.length / 2)}\nContext size: ~${contextChars.toLocaleString()} chars (~${contextTokensEstimate.toLocaleString()} tokens)\nMax history: 10 turns`,
        },
      };
    }
    case "/help":
      return {
        result: {
          type: "text",
          content: `AI mode commands:

  /status    Show current model info
  /clear     Clear conversation history
  /context   Show context usage
  /help      Show this help

  !          Switch to terminal mode`,
        },
      };
    default:
      return null;
  }
}

export function TerminalWindow({
  posts,
  aboutContent,
  initialCommand,
  preloadedContent,
}: TerminalWindowProps) {
  const [lines, setLines] = useState<TerminalLine[]>(createInitialLines);
  const [currentPath, setCurrentPath] = useState("~");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);
  const [promptQueue, setPromptQueue] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<ChatMessage[]>([]);
  const sessionIdRef = useRef(crypto.randomUUID());
  const lineIdRef = useRef(100);

  const nextId = useCallback(() => {
    lineIdRef.current += 1;
    return `line-${lineIdRef.current}`;
  }, []);

  const fs = useMemo(() => buildFileSystem(posts), [posts]);
  const allSlugs = useMemo(() => posts.map((p) => p.slug), [posts]);
  const completionContext = useMemo(
    () => ({
      slugs: allSlugs,
      dirs: fs.directories,
      pathEntries: posts.map((p) => `${p.category}/${p.slug}`),
      currentPath,
    }),
    [allSlugs, fs.directories, posts, currentPath],
  );

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on every lines change
  useEffect(() => {
    scrollToBottom();
  }, [lines, scrollToBottom]);

  const addLine = useCallback((line: TerminalLine) => {
    setLines((prev) => {
      const next = [...prev, line];
      return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
    });
  }, []);

  const replaceLine = useCallback((targetId: string, result: CommandResult) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === targetId ? { ...l, result, isPending: false } : l,
      ),
    );
  }, []);

  const handleCat = useCallback(
    async (slug: string) => {
      const preloaded = preloadedContent?.[slug];
      if (preloaded) {
        addLine({
          id: nextId(),
          type: "output",
          result: { type: "markdown", content: preloaded },
        });
        setIsProcessing(false);
        return;
      }

      const loadingId = nextId();
      addLine({
        id: loadingId,
        type: "output",
        result: { type: "text", content: "Loading..." },
        isPending: true,
      });

      try {
        const res = await fetch(`/api/posts/${slug}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        replaceLine(loadingId, { type: "markdown", content: data.content });
      } catch {
        replaceLine(loadingId, {
          type: "error",
          content: `cat: ${slug}: Failed to load content`,
        });
      }
      setIsProcessing(false);
    },
    [addLine, nextId, replaceLine, preloadedContent],
  );

  const handleAsk = useCallback(
    async (question: string, withHistory = false) => {
      const loadingId = nextId();
      addLine({
        id: loadingId,
        type: "output",
        result: { type: "text", content: "Thinking..." },
        isPending: true,
      });

      const buildContent = (
        answer: string,
        sources: Array<{ title: string; slug: string; category: string }>,
      ): string => {
        let content = answer;
        if (sources.length > 0) {
          content += "\n\n---\nSources:";
          for (const src of sources) {
            content += `\n  - [${src.title}](/posts/${src.slug})`;
          }
        }
        return content;
      };

      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            history: withHistory ? chatHistoryRef.current : undefined,
            sessionId: sessionIdRef.current,
          }),
        });

        if (!res.ok || !res.body) throw new Error("API error");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let answer = "";
        let sources: Array<{ title: string; slug: string; category: string }> =
          [];
        let streamError: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const evt of events) {
            if (!evt.trim()) continue;
            let name = "";
            let dataStr = "";
            for (const line of evt.split("\n")) {
              if (line.startsWith("event: ")) name = line.slice(7);
              else if (line.startsWith("data: ")) dataStr = line.slice(6);
            }
            if (!name) continue;

            if (name === "sources") {
              sources = JSON.parse(dataStr);
            } else if (name === "token") {
              answer += JSON.parse(dataStr);
              replaceLine(loadingId, {
                type: "markdown",
                content: buildContent(answer, sources),
              });
            } else if (name === "error") {
              streamError = JSON.parse(dataStr).message ?? "stream error";
            }
          }
        }

        if (streamError) throw new Error(streamError);

        if (withHistory && answer) {
          chatHistoryRef.current = [
            ...chatHistoryRef.current,
            { role: "user", content: question },
            { role: "assistant", content: answer },
          ];
        }
      } catch {
        replaceLine(loadingId, {
          type: "error",
          content: "ask: error connecting to AI. Try again later.",
        });
      }
      setIsProcessing(false);
    },
    [addLine, nextId, replaceLine],
  );

  const handleCommand = useCallback(
    (input: string) => {
      // AI mode
      if (isAiMode) {
        // AI 스트리밍 중이면 큐에 적재만 하고 반환 (dequeue 시점에 라인 렌더)
        if (isProcessing) {
          setPromptQueue((prev) => [...prev, input]);
          return;
        }

        addLine({
          id: nextId(),
          type: "input",
          prompt: "ai",
          command: input,
        });
        setCommandHistory((prev) => [...prev, input]);

        const slashResult = executeAiSlashCommand(
          input.trim().toLowerCase(),
          chatHistoryRef.current,
        );
        if (slashResult) {
          if (slashResult.clearHistory) {
            chatHistoryRef.current = [];
            sessionIdRef.current = crypto.randomUUID();
          }
          addLine({ id: nextId(), type: "output", result: slashResult.result });
          return;
        }

        setIsProcessing(true);
        handleAsk(input, true);
        return;
      }

      // Terminal mode
      addLine({
        id: nextId(),
        type: "input",
        prompt: currentPath,
        command: input,
      });

      setCommandHistory((prev) => [...prev, input]);

      const parsed = parseCommand(input);
      const fsState = { ...fs, currentPath };
      const { result, newPath, asyncAction, asyncArg, openMailto } =
        executeCommand(parsed, fsState, posts, commandHistory, aboutContent);

      if (result?.type === "clear") {
        setLines([]);
        return;
      }

      if (newPath !== undefined) {
        setCurrentPath(newPath);
      }

      if (openMailto) {
        window.location.href =
          "mailto:senugw0u@gmail.com?subject=[seunan.dev] Contact";
      }

      if (result) {
        addLine({ id: nextId(), type: "output", result });
        return;
      }

      if (asyncAction && asyncArg) {
        setIsProcessing(true);
        if (asyncAction === "cat") {
          handleCat(asyncArg);
        } else if (asyncAction === "ask") {
          handleAsk(asyncArg, false);
        }
      }
    },
    [
      currentPath,
      fs,
      posts,
      aboutContent,
      commandHistory,
      isAiMode,
      isProcessing,
      addLine,
      nextId,
      handleCat,
      handleAsk,
    ],
  );

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

  const initialCommandExecuted = useRef(false);
  useEffect(() => {
    if (initialCommand && !initialCommandExecuted.current) {
      initialCommandExecuted.current = true;
      handleCommand(initialCommand);
    }
  }, [initialCommand, handleCommand]);

  const toggleAiMode = useCallback(() => {
    setIsAiMode((prev) => !prev);
    setPromptQueue([]);
  }, []);

  const popQueue = useCallback(() => {
    setPromptQueue((prev) => prev.slice(0, -1));
  }, []);

  const handleTerminalClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("a")) return;

    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;

    const input = document.querySelector(
      'input[type="text"]',
    ) as HTMLInputElement;
    input?.focus();
  }, []);

  return (
    <div className="h-screen w-screen flex items-center justify-center overflow-hidden relative">
      <TerminalBackground />

      <div className="relative z-10 w-[90%] h-[90dvh] md:h-[90vh] flex flex-col rounded-lg overflow-hidden shadow-2xl border border-ctp-surface0">
        {/* Title bar */}
        <div className="shrink-0 bg-ctp-mantle/90 backdrop-blur-md rounded-t-lg px-4 py-2 flex items-center gap-2 border-b border-ctp-surface0">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-ctp-red" />
            <div className="w-3 h-3 rounded-full bg-ctp-yellow" />
            <div className="w-3 h-3 rounded-full bg-ctp-green" />
          </div>
          <span className="text-ctp-subtext0 text-xs mx-auto">
            seunan.dev — terminal
          </span>
        </div>

        {/* biome-ignore lint/a11y/noStaticElementInteractions: terminal container needs click handler for focus */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard input handled by CommandInput */}
        <div
          ref={scrollRef}
          onClick={handleTerminalClick}
          className="flex-1 overflow-y-auto p-4 font-mono text-sm text-ctp-text bg-ctp-base/90 backdrop-blur-md terminal-scroll cursor-text select-text"
        >
          {lines.map((line) => (
            <div key={line.id} className="mb-1">
              <TerminalLineRenderer line={line} onCommand={handleCommand} />
            </div>
          ))}

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
        </div>

        <MobileCommandBar
          onCommand={handleCommand}
          disabled={isProcessing}
          isAiMode={isAiMode}
        />
      </div>
    </div>
  );
}
