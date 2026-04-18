"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/lib";

interface MobileCommandBarProps {
  onCommand: (command: string) => void;
  disabled?: boolean;
  isAiMode?: boolean;
}

const PRIMARY_COMMANDS = [
  { label: "ls", cmd: "ls" },
  { label: "help", cmd: "help" },
  { label: "about", cmd: "about" },
  { label: "clear", cmd: "clear" },
];

const EXTRA_COMMANDS = [
  { label: "tags", cmd: "tags" },
  { label: "cd ~", cmd: "cd ~" },
  { label: "cd ..", cmd: "cd .." },
  { label: "banner", cmd: "banner" },
  { label: "whoami", cmd: "whoami" },
  { label: "date", cmd: "date" },
  { label: "history", cmd: "history" },
  { label: "email", cmd: "email" },
];

export function MobileCommandBar({
  onCommand,
  disabled,
  isAiMode,
}: MobileCommandBarProps) {
  const [expanded, setExpanded] = useState(false);

  const aiCommands = [
    { label: "/help", cmd: "/help" },
    { label: "/status", cmd: "/status" },
    { label: "/clear", cmd: "/clear" },
  ];

  const primary = isAiMode ? aiCommands : PRIMARY_COMMANDS;

  return (
    <div className="bg-ctp-mantle border-t border-ctp-surface1 md:hidden">
      <div className="flex items-center gap-1.5 p-2">
        <div className="flex gap-1.5 overflow-x-auto flex-1">
          {primary.map((cmd) => (
            <button
              key={cmd.cmd}
              type="button"
              onClick={() => onCommand(cmd.cmd)}
              disabled={disabled}
              className="shrink-0 px-3 py-1.5 rounded bg-ctp-surface0 text-ctp-text text-xs font-mono hover:bg-ctp-surface1 active:bg-ctp-surface2 disabled:opacity-50 transition-colors"
            >
              {cmd.label}
            </button>
          ))}
        </div>
        {!isAiMode && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "shrink-0 p-1.5 rounded transition-colors",
              expanded
                ? "bg-ctp-surface1 text-ctp-text"
                : "bg-ctp-surface0 text-ctp-subtext0 hover:bg-ctp-surface1",
            )}
            aria-label={expanded ? "Collapse commands" : "More commands"}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        )}
      </div>
      {expanded && !isAiMode && (
        <div className="flex flex-wrap gap-1.5 px-2 pb-2">
          {EXTRA_COMMANDS.map((cmd) => (
            <button
              key={cmd.cmd}
              type="button"
              onClick={() => {
                onCommand(cmd.cmd);
                setExpanded(false);
              }}
              disabled={disabled}
              className="px-3 py-1.5 rounded bg-ctp-surface0/60 text-ctp-subtext1 text-xs font-mono hover:bg-ctp-surface1 active:bg-ctp-surface2 disabled:opacity-50 transition-colors"
            >
              {cmd.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
