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
}: CommandInputProps) {
  const [input, setInput] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [completions, setCompletions] = useState<string[]>([]);
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

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
        setCompletions([]);
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

      // Tab: autocomplete (terminal mode)
      if (e.key === "Tab") {
        e.preventDefault();
        const matches = getCommandCompletions(input, completionContext);
        if (matches.length === 1) {
          const parts = input.trim().split(/\s+/);
          if (parts.length <= 1) {
            const newInput = `${matches[0]} `;
            setInput(newInput);
            setCursorPos(newInput.length);
          } else {
            const newInput = `${parts[0]} ${matches[0]}`;
            setInput(newInput);
            setCursorPos(newInput.length);
          }
          setCompletions([]);
        } else if (matches.length > 1) {
          setCompletions(matches);
        }
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
        setCompletions([]);
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
        setCompletions([]);
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
          setCompletions([]);
        }
        return;
      }

      // Any other key clears completions
      setCompletions([]);
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
        <div className="text-ctp-overlay1 mb-1">{completions.join("  ")}</div>
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
            disabled={disabled}
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
            {!disabled && <TerminalCursor />}
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
      {!input && !disabled && !showSlashMenu && (
        <div className="text-ctp-overlay0 text-xs mt-1">
          {isAiMode ? "! for terminal mode · / for commands" : "! for AI mode"}
        </div>
      )}
    </div>
  );
}
