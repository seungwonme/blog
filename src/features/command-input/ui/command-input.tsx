"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CompletionContext } from "@/entities/command";
import { getCommandCompletions } from "@/entities/command";
import { cn } from "@/shared/lib";
import { TerminalCursor, TerminalPrompt } from "@/shared/ui";

interface SlashMenuItemProps {
  cmd: { name: string; description: string };
  isSelected: boolean;
  onMouseEnter: () => void;
  onSelect: () => void;
}

const SlashMenuItem = memo(function SlashMenuItem({
  cmd,
  isSelected,
  onMouseEnter,
  onSelect,
}: SlashMenuItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 px-3 py-1.5 font-mono text-sm cursor-pointer",
        isSelected
          ? "bg-ctp-surface0 text-ctp-text"
          : "text-ctp-subtext0 hover:bg-ctp-surface0/50",
      )}
      role="option"
      tabIndex={-1}
      aria-selected={isSelected}
      onMouseEnter={onMouseEnter}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect();
      }}
      onClick={onSelect}
    >
      <span className="text-ctp-lavender min-w-[100px]">{cmd.name}</span>
      <span className="text-ctp-overlay1 truncate">{cmd.description}</span>
    </div>
  );
});

const AI_SLASH_COMMANDS = [
  { name: "/status", description: "Show current model info" },
  { name: "/clear", description: "Clear conversation history" },
  { name: "/context", description: "Show context usage" },
  { name: "/help", description: "Show available commands" },
] as const;

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
  const [input, setInput] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [completions, setCompletions] = useState<string[]>([]);
  const [cycleIndex, setCycleIndex] = useState(-1);
  const cycleOriginalRef = useRef<string>("");
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const exitCycle = useCallback(() => {
    setCycleIndex(-1);
    setCompletions([]);
  }, []);

  const applyCompletion = useCallback(
    (base: string, candidate: string): string => {
      const endsWithSpace = /\s$/.test(base);
      const parts = base.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) {
        return `${candidate} `;
      }
      if (parts.length === 1 && !endsWithSpace) {
        // Still typing the command itself
        return `${candidate} `;
      }
      // Completing an argument of cmd
      return `${parts[0]} ${candidate}`;
    },
    [],
  );

  // Compute filtered slash commands based on current input
  const slashMatches = useMemo(
    () =>
      isAiMode && input.startsWith("/") && !input.includes(" ")
        ? AI_SLASH_COMMANDS.filter((cmd) =>
            cmd.name.startsWith(input.toLowerCase()),
          )
        : [],
    [isAiMode, input],
  );
  const showSlashMenu = slashMatches.length > 0;

  // Reset menu index when matches change and scroll to show menu
  useEffect(() => {
    setSlashMenuIndex(0);
    if (slashMatches.length > 0) {
      onLayoutChange?.();
    }
  }, [slashMatches.length, onLayoutChange]);

  useEffect(() => {
    if (!disabled || isAiMode) {
      inputRef.current?.focus();
    }
  }, [disabled, isAiMode]);

  // Sync cursor position after input changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: need to trigger on both cursorPos and input changes
  useEffect(() => {
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(cursorPos, cursorPos);
      }
    });
  }, [cursorPos, input]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // IME 조합 중에는 키 이벤트 무시 (한글 이중 입력 방지).
      // Esc 는 IME 취소 시그널이라 isComposing=true 로 오지만 queue pop 은 처리해야 함.
      if (e.nativeEvent.isComposing && e.key !== "Escape") return;

      // Cmd+K: clear (macOS)
      if (e.metaKey && e.key === "k") {
        e.preventDefault();
        onSubmit("clear");
        return;
      }

      // Ctrl+L: clear
      if (e.ctrlKey && e.key === "l") {
        e.preventDefault();
        onSubmit("clear");
        return;
      }

      // Ctrl+A: move cursor to start
      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        setCursorPos(0);
        return;
      }

      // Ctrl+E: move cursor to end
      if (e.ctrlKey && e.key === "e") {
        e.preventDefault();
        setCursorPos(input.length);
        return;
      }

      // Ctrl+U: delete from cursor to start
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
        const pos = inputRef.current?.selectionStart ?? cursorPos;
        setInput(input.slice(pos));
        setCursorPos(0);
        return;
      }

      // Ctrl+W: delete previous word
      if (e.ctrlKey && e.key === "w") {
        e.preventDefault();
        const pos = inputRef.current?.selectionStart ?? cursorPos;
        const before = input.slice(0, pos);
        const after = input.slice(pos);
        // Find start of previous word
        const trimmed = before.trimEnd();
        const lastSpace = trimmed.lastIndexOf(" ");
        const newBefore =
          lastSpace === -1 ? "" : before.slice(0, lastSpace + 1);
        setInput(newBefore + after);
        setCursorPos(newBefore.length);
        return;
      }

      // Ctrl+C: cancel input
      if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        setInput("");
        setCursorPos(0);
        setHistoryIndex(-1);
        exitCycle();
        return;
      }

      // Slash menu navigation
      if (showSlashMenu) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSlashMenuIndex((prev) =>
            prev <= 0 ? slashMatches.length - 1 : prev - 1,
          );
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSlashMenuIndex((prev) =>
            prev >= slashMatches.length - 1 ? 0 : prev + 1,
          );
          return;
        }
        if (e.key === "Tab" || e.key === "Enter") {
          e.preventDefault();
          const selected = slashMatches[slashMenuIndex];
          if (selected) {
            // If it's an exact match, submit directly
            if (input.toLowerCase() === selected.name) {
              onSubmit(selected.name);
              setInput("");
              setCursorPos(0);
              setHistoryIndex(-1);
            } else {
              // Fill in the command
              setInput(selected.name);
              setCursorPos(selected.name.length);
            }
          }
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setInput("");
          setCursorPos(0);
          return;
        }
      }

      // Tab / Shift+Tab: autocomplete (terminal mode only)
      if (e.key === "Tab") {
        e.preventDefault();
        if (isAiMode) return;

        // Already cycling → advance
        if (cycleIndex >= 0 && completions.length > 0) {
          const direction = e.shiftKey ? -1 : 1;
          const next =
            (cycleIndex + direction + completions.length) % completions.length;
          const newInput = applyCompletion(
            cycleOriginalRef.current,
            completions[next],
          );
          setInput(newInput);
          setCursorPos(newInput.length);
          setCycleIndex(next);
          return;
        }

        // Fresh completion
        const matches = getCommandCompletions(input, completionContext);
        if (matches.length === 0) return;

        if (matches.length === 1) {
          const newInput = applyCompletion(input, matches[0]);
          setInput(newInput);
          setCursorPos(newInput.length);
          setCompletions([]);
          return;
        }

        // Multiple matches → show list + start cycling at first candidate
        cycleOriginalRef.current = input;
        setCompletions(matches);
        setCycleIndex(0);
        const newInput = applyCompletion(input, matches[0]);
        setInput(newInput);
        setCursorPos(newInput.length);
        return;
      }

      // Escape while cycling → restore original input
      if (e.key === "Escape" && cycleIndex >= 0) {
        e.preventDefault();
        setInput(cycleOriginalRef.current);
        setCursorPos(cycleOriginalRef.current.length);
        exitCycle();
        return;
      }

      // Arrow keys while cycling → navigate candidates
      if (
        cycleIndex >= 0 &&
        completions.length > 0 &&
        (e.key === "ArrowLeft" ||
          e.key === "ArrowRight" ||
          e.key === "ArrowUp" ||
          e.key === "ArrowDown")
      ) {
        e.preventDefault();
        const direction = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
        const next =
          (cycleIndex + direction + completions.length) % completions.length;
        const newInput = applyCompletion(
          cycleOriginalRef.current,
          completions[next],
        );
        setInput(newInput);
        setCursorPos(newInput.length);
        setCycleIndex(next);
        return;
      }

      // Esc (AI mode, empty input, queue exists) → pop queue
      if (e.key === "Escape" && isAiMode && input === "" && onEscapePopQueue) {
        e.preventDefault();
        onEscapePopQueue();
        return;
      }

      // Arrow Up: previous history
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (history.length === 0) return;
        const newIndex =
          historyIndex === -1
            ? history.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
        setCursorPos(history[newIndex].length);
        exitCycle();
        return;
      }

      // Arrow Down: next history
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex === -1) return;
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setInput("");
          setCursorPos(0);
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
          setCursorPos(history[newIndex].length);
        }
        exitCycle();
        return;
      }

      // Enter: submit
      if (e.key === "Enter") {
        e.preventDefault();
        if (input.trim()) {
          onSubmit(input.trim());
          setInput("");
          setCursorPos(0);
          setHistoryIndex(-1);
          exitCycle();
        }
        return;
      }

      // Any other key exits cycle + clears completions (keeping current selection)
      exitCycle();
    },
    [
      input,
      cursorPos,
      history,
      historyIndex,
      completionContext,
      onSubmit,
      showSlashMenu,
      slashMatches,
      slashMenuIndex,
      cycleIndex,
      completions,
      applyCompletion,
      exitCycle,
      isAiMode,
      onEscapePopQueue,
    ],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      // Toggle AI mode when '!' is typed on empty input
      if (value === "!" && input === "" && onToggleAiMode) {
        onToggleAiMode();
        return;
      }

      setInput(value);
      setCursorPos(e.target.selectionStart ?? value.length);
    },
    [input, onToggleAiMode],
  );

  const handleSelect = useCallback(() => {
    if (inputRef.current) {
      setCursorPos(inputRef.current.selectionStart ?? 0);
    }
  }, []);

  const beforeCursor = input.slice(0, cursorPos);
  const afterCursor = input.slice(cursorPos);

  return (
    <div>
      {completions.length > 0 && (
        <div className="text-ctp-overlay1 mb-1 flex flex-wrap gap-x-3 gap-y-0.5">
          {completions.map((c, i) => (
            <span
              key={c}
              className={cn(
                "px-1",
                i === cycleIndex ? "bg-ctp-surface0 text-ctp-text rounded" : "",
              )}
            >
              {c}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center">
        <TerminalPrompt
          path={currentPath}
          variant={isAiMode ? "ai" : "terminal"}
        />
        <span className="text-ctp-text">&nbsp;</span>
        <div
          className="relative flex-1 flex items-center"
          suppressHydrationWarning
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            disabled={disabled && !isAiMode}
            className="bg-transparent text-ctp-text outline-none w-full caret-transparent font-mono text-sm"
            placeholder={isAiMode ? "Ask anything..." : undefined}
            aria-label={isAiMode ? "AI search input" : "Terminal command input"}
            // biome-ignore lint/a11y/noAutofocus: terminal input must auto-focus
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
          />
          <span className="absolute left-0 pointer-events-none text-sm">
            <span className="invisible">{beforeCursor}</span>
            {(!disabled || isAiMode) && <TerminalCursor />}
            <span className="invisible">{afterCursor}</span>
          </span>
        </div>
      </div>
      {/* Slash command menu — below input */}
      {showSlashMenu && (
        <div className="mt-1 border border-ctp-surface0 rounded bg-ctp-mantle overflow-hidden">
          {slashMatches.map((cmd, i) => (
            <SlashMenuItem
              key={cmd.name}
              cmd={cmd}
              isSelected={i === slashMenuIndex}
              onMouseEnter={() => setSlashMenuIndex(i)}
              onSelect={() => {
                onSubmit(cmd.name);
                setInput("");
                setCursorPos(0);
                setHistoryIndex(-1);
                inputRef.current?.focus();
              }}
            />
          ))}
        </div>
      )}
      {/* Hint */}
      {!showSlashMenu && queueSize === 0 && !input && !disabled && (
        <div className="text-ctp-overlay0 text-xs mt-1">
          {isAiMode ? "! for terminal mode · / for commands" : "! for AI mode"}
        </div>
      )}
    </div>
  );
}
