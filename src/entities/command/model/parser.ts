import type { CommandName, ParsedCommand } from "./types";

const VALID_COMMANDS: CommandName[] = [
  "help",
  "banner",
  "ls",
  "cd",
  "cat",
  "grep",
  "ask",
  "about",
  "tags",
  "whoami",
  "history",
  "clear",
];

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  if (!trimmed) {
    return { name: null, args: [], raw: trimmed };
  }

  // Handle ask with quoted argument: ask "question here"
  const askMatch = trimmed.match(/^ask\s+["'](.+?)["']$/);
  if (askMatch) {
    return { name: "ask", args: [askMatch[1]], raw: trimmed };
  }

  // Handle ask without quotes: ask question here
  const askNoQuoteMatch = trimmed.match(/^ask\s+(.+)$/);
  if (askNoQuoteMatch) {
    return { name: "ask", args: [askNoQuoteMatch[1]], raw: trimmed };
  }

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (VALID_COMMANDS.includes(cmd as CommandName)) {
    return { name: cmd as CommandName, args, raw: trimmed };
  }

  return { name: null, args: [], raw: trimmed };
}

export interface CompletionContext {
  slugs: string[];
  dirs: string[];
  /** Map of category → slugs for path-based completion */
  pathEntries: string[];
}

export function getCommandCompletions(
  partial: string,
  context: CompletionContext,
): string[] {
  const trimmed = partial.trim();
  const parts = trimmed.split(/\s+/);

  // Complete command name
  if (parts.length <= 1) {
    return VALID_COMMANDS.filter((cmd) => cmd.startsWith(trimmed));
  }

  const cmd = parts[0];
  const argPartial = parts.slice(1).join(" ");

  // Complete arguments based on command
  if (cmd === "cat") {
    // Match both plain slugs and category/slug paths
    const allOptions = [...context.slugs, ...context.pathEntries];
    return [...new Set(allOptions.filter((s) => s.startsWith(argPartial)))];
  }
  if (cmd === "cd") {
    const dirs = ["~", "..", ...context.dirs];
    return dirs.filter((d) => d.startsWith(argPartial));
  }
  if (cmd === "grep") {
    return [];
  }

  return [];
}

export { VALID_COMMANDS };
