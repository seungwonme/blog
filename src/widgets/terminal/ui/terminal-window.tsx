"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CommandResult, TerminalLine } from "@/entities/command";
import { parseCommand } from "@/entities/command";
import { buildFileSystem } from "@/entities/file-system";
import type { Post } from "@/entities/post";
import { executeCommand } from "@/features/command-executor";
import { CommandInput } from "@/features/command-input";
import { TerminalLineRenderer } from "@/features/terminal-output";
import { ASCII_BANNER } from "@/shared/lib/ascii-banner";
import { MobileCommandBar } from "./mobile-command-bar";
import { TerminalBackground } from "./terminal-background";

interface TerminalWindowProps {
  posts: Post[];
  initialCommand?: string;
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

export function TerminalWindow({ posts, initialCommand }: TerminalWindowProps) {
  const [lines, setLines] = useState<TerminalLine[]>(createInitialLines);
  const [currentPath, setCurrentPath] = useState("~");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);
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
      prev.map((l) => (l.id === targetId ? { ...l, result } : l)),
    );
  }, []);

  const handleCat = useCallback(
    async (slug: string) => {
      const post = posts.find((p) => p.slug === slug);
      if (!post) {
        addLine({
          id: nextId(),
          type: "output",
          result: {
            type: "error",
            content: `cat: ${slug}: No such file`,
          },
        });
        setIsProcessing(false);
        return;
      }

      if (post.content) {
        addLine({
          id: nextId(),
          type: "output",
          result: { type: "markdown", content: post.content },
        });
        setIsProcessing(false);
        return;
      }

      const loadingId = nextId();
      addLine({
        id: loadingId,
        type: "output",
        result: { type: "text", content: "Loading..." },
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
    [posts, addLine, nextId, replaceLine],
  );

  const handleAsk = useCallback(
    async (question: string, withHistory = false) => {
      const loadingId = nextId();
      addLine({
        id: loadingId,
        type: "output",
        result: { type: "text", content: "Thinking..." },
      });

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

        if (!res.ok) throw new Error("API error");

        const data = await res.json();

        let content = data.answer;
        if (data.sources?.length > 0) {
          content += "\n\n---\nSources:";
          for (const src of data.sources) {
            content += `\n  - [${src.title}](/posts/${src.slug})`;
          }
        }

        if (withHistory) {
          chatHistoryRef.current = [
            ...chatHistoryRef.current,
            { role: "user", content: question },
            { role: "assistant", content: data.answer },
          ];
        }

        replaceLine(loadingId, { type: "markdown", content });
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
        executeCommand(parsed, fsState, posts, commandHistory);

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
      commandHistory,
      isAiMode,
      addLine,
      nextId,
      handleCat,
      handleAsk,
    ],
  );

  const initialCommandExecuted = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: run only once on mount when handleCommand is ready
  useEffect(() => {
    if (initialCommand && !initialCommandExecuted.current) {
      initialCommandExecuted.current = true;
      handleCommand(initialCommand);
    }
  }, [initialCommand, handleCommand]);

  const toggleAiMode = useCallback(() => {
    setIsAiMode((prev) => !prev);
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
