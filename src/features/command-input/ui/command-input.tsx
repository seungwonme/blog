"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CompletionContext } from "@/entities/command";
import { getCommandCompletions } from "@/entities/command";
import { TerminalCursor, TerminalPrompt } from "@/shared/ui";

interface CommandInputProps {
  currentPath: string;
  onSubmit: (command: string) => void;
  history: string[];
  completionContext: CompletionContext;
  disabled?: boolean;
}

export function CommandInput({
  currentPath,
  onSubmit,
  history,
  completionContext,
  disabled = false,
}: CommandInputProps) {
  const [input, setInput] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [completions, setCompletions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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

      // Tab: autocomplete
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
    [input, cursorPos, history, historyIndex, completionContext, onSubmit],
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setCursorPos(e.target.selectionStart ?? e.target.value.length);
  }, []);

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
        <TerminalPrompt path={currentPath} />
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
    </div>
  );
}
