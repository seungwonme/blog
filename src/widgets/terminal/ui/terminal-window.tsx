"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TerminalLine } from "@/entities/command";
import { parseCommand } from "@/entities/command";
import { buildFileSystem } from "@/entities/file-system";
import type { Post } from "@/entities/post";
import { executeCommand } from "@/features/command-executor";
import { CommandInput } from "@/features/command-input";
import { TerminalLineRenderer } from "@/features/terminal-output";
import { ASCII_BANNER } from "./ascii-banner";
import { MobileCommandBar } from "./mobile-command-bar";
import { TerminalBackground } from "./terminal-background";

interface TerminalWindowProps {
  posts: Post[];
}

const lineIdCounter = { current: 100 };
function nextId(): string {
  lineIdCounter.current += 1;
  return `line-${lineIdCounter.current}`;
}

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

export function TerminalWindow({ posts }: TerminalWindowProps) {
  const [lines, setLines] = useState<TerminalLine[]>(createInitialLines);
  const [currentPath, setCurrentPath] = useState("~");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fs = useMemo(() => buildFileSystem(posts), [posts]);
  const allSlugs = useMemo(() => posts.map((p) => p.slug), [posts]);
  const completionContext = useMemo(
    () => ({
      slugs: allSlugs,
      dirs: fs.directories,
      pathEntries: posts.map((p) => `${p.category}/${p.slug}`),
    }),
    [allSlugs, fs.directories, posts],
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
    setLines((prev) => [...prev, line]);
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

      // If content is already loaded
      if (post.content) {
        addLine({
          id: nextId(),
          type: "output",
          result: { type: "markdown", content: post.content },
        });
        setIsProcessing(false);
        return;
      }

      // Fetch content
      addLine({
        id: nextId(),
        type: "output",
        result: { type: "text", content: "Loading..." },
      });

      try {
        const res = await fetch(`/api/posts/${slug}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        // Replace loading with actual content
        setLines((prev) => {
          const newLines = [...prev];
          newLines[newLines.length - 1] = {
            id: nextId(),
            type: "output",
            result: { type: "markdown", content: data.content },
          };
          return newLines;
        });
      } catch {
        setLines((prev) => {
          const newLines = [...prev];
          newLines[newLines.length - 1] = {
            id: nextId(),
            type: "output",
            result: {
              type: "error",
              content: `cat: ${slug}: Failed to load content`,
            },
          };
          return newLines;
        });
      }
      setIsProcessing(false);
    },
    [posts, addLine],
  );

  const handleGrep = useCallback(
    (keyword: string) => {
      const lower = keyword.toLowerCase();
      const matches = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower) ||
          p.tags.some((t) => t.toLowerCase().includes(lower)),
      );

      if (matches.length === 0) {
        addLine({
          id: nextId(),
          type: "output",
          result: {
            type: "error",
            content: `grep: no results for "${keyword}"`,
          },
        });
      } else {
        const content = matches
          .map(
            (p) =>
              `${p.slug}\t${p.date}\t${p.tags.map((t) => `#${t}`).join(" ")}\n  ${p.description || p.title}`,
          )
          .join("\n\n");
        addLine({
          id: nextId(),
          type: "output",
          result: { type: "posts", content },
        });
      }
      setIsProcessing(false);
    },
    [posts, addLine],
  );

  const handleAsk = useCallback(
    async (question: string) => {
      addLine({
        id: nextId(),
        type: "output",
        result: { type: "text", content: "Thinking..." },
      });

      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });

        if (!res.ok) throw new Error("API error");

        const data = await res.json();

        let content = data.answer;
        if (data.sources && data.sources.length > 0) {
          content += "\n\n---\nSources:";
          for (const src of data.sources) {
            content += `\n  - ${src.title} (cat ${src.slug})`;
          }
        }

        setLines((prev) => {
          const newLines = [...prev];
          newLines[newLines.length - 1] = {
            id: nextId(),
            type: "output",
            result: { type: "markdown", content },
          };
          return newLines;
        });
      } catch {
        setLines((prev) => {
          const newLines = [...prev];
          newLines[newLines.length - 1] = {
            id: nextId(),
            type: "output",
            result: {
              type: "error",
              content: "ask: error connecting to AI. Try again later.",
            },
          };
          return newLines;
        });
      }
      setIsProcessing(false);
    },
    [addLine],
  );

  const handleCommand = useCallback(
    (input: string) => {
      // Add input line
      addLine({
        id: nextId(),
        type: "input",
        prompt: currentPath,
        command: input,
      });

      setCommandHistory((prev) => [...prev, input]);

      const parsed = parseCommand(input);
      const fsState = { ...fs, currentPath };
      const { result, newPath, asyncAction, asyncArg } = executeCommand(
        parsed,
        fsState,
        posts,
        commandHistory,
      );

      // Handle clear
      if (result?.type === "clear") {
        setLines([]);
        return;
      }

      // Handle path change
      if (newPath !== undefined) {
        setCurrentPath(newPath);
      }

      // Handle sync result
      if (result) {
        addLine({ id: nextId(), type: "output", result });
        return;
      }

      // Handle async actions
      if (asyncAction && asyncArg) {
        setIsProcessing(true);
        if (asyncAction === "cat") {
          handleCat(asyncArg);
        } else if (asyncAction === "grep") {
          handleGrep(asyncArg);
        } else if (asyncAction === "ask") {
          handleAsk(asyncArg);
        }
      }
    },
    [
      currentPath,
      fs,
      posts,
      commandHistory,
      addLine,
      handleCat,
      handleGrep,
      handleAsk,
    ],
  );

  // Focus terminal on click — but not if user is selecting text or clicking a link
  const handleTerminalClick = useCallback((e: React.MouseEvent) => {
    // Don't steal focus from links
    const target = e.target as HTMLElement;
    if (target.closest("a")) return;

    // Don't steal focus if user is selecting text
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;

    const input = document.querySelector(
      'input[type="text"]',
    ) as HTMLInputElement;
    input?.focus();
  }, []);

  return (
    <div className="h-screen w-screen flex items-center justify-center overflow-hidden relative">
      {/* Background effect */}
      <TerminalBackground />

      {/* Terminal window */}
      <div className="relative z-10 w-[90%] h-[90vh] flex flex-col rounded-lg overflow-hidden shadow-2xl border border-ctp-surface0">
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

        {/* Terminal body */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: terminal container needs click handler for focus */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard input handled by CommandInput */}
        <div
          ref={scrollRef}
          onClick={handleTerminalClick}
          className="flex-1 overflow-y-auto p-4 font-mono text-sm text-ctp-text bg-ctp-base/90 backdrop-blur-md terminal-scroll cursor-text select-text"
        >
          {lines.map((line) => (
            <div key={line.id} className="mb-1">
              <TerminalLineRenderer line={line} />
            </div>
          ))}

          <CommandInput
            currentPath={currentPath}
            onSubmit={handleCommand}
            history={commandHistory}
            completionContext={completionContext}
            disabled={isProcessing}
          />
        </div>

        {/* Mobile command bar */}
        <MobileCommandBar onCommand={handleCommand} disabled={isProcessing} />
      </div>
    </div>
  );
}
