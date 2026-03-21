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
  | "history"
  | "clear";

export interface ParsedCommand {
  name: CommandName | null;
  args: string[];
  raw: string;
}

export interface CommandResult {
  type:
    | "text"
    | "markdown"
    | "error"
    | "clear"
    | "loading"
    | "posts"
    | "banner";
  content: string;
  isStreaming?: boolean;
  sources?: Array<{ title: string; slug: string }>;
}

export interface TerminalLine {
  id: string;
  type: "input" | "output" | "banner";
  prompt?: string;
  command?: string;
  result?: CommandResult;
}
