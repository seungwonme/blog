export type CommandName =
  | "help"
  | "banner"
  | "ls"
  | "cd"
  | "cat"
  | "grep"
  | "ask"
  | "about"
  | "tags"
  | "whoami"
  | "hostname"
  | "echo"
  | "email"
  | "date"
  | "history"
  | "clear";

export interface ParsedCommand {
  name: CommandName | null;
  args: string[];
  raw: string;
}

export interface CommandResult {
  type: "text" | "markdown" | "error" | "clear" | "posts" | "banner";
  content: string;
}

export interface TerminalLine {
  id: string;
  type: "input" | "output" | "banner";
  prompt?: string;
  command?: string;
  result?: CommandResult;
  /** true인 동안 로딩 shimmer 애니메이션으로 렌더 (비동기 결과 대기 중). */
  isPending?: boolean;
}
