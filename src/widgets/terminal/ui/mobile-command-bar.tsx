"use client";

interface MobileCommandBarProps {
  onCommand: (command: string) => void;
  disabled?: boolean;
}

const QUICK_COMMANDS = [
  { label: "ls", cmd: "ls" },
  { label: "help", cmd: "help" },
  { label: "about", cmd: "about" },
  { label: "tags", cmd: "tags" },
  { label: "clear", cmd: "clear" },
];

export function MobileCommandBar({
  onCommand,
  disabled,
}: MobileCommandBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto p-2 bg-ctp-mantle border-t border-ctp-surface1 md:hidden">
      {QUICK_COMMANDS.map((cmd) => (
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
  );
}
