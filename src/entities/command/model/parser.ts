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
  "hostname",
  "echo",
  "email",
  "date",
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

  // Handle echo: preserve everything after "echo "
  const echoMatch = trimmed.match(/^echo\s+(.+)$/);
  if (echoMatch) {
    return { name: "echo", args: [echoMatch[1]], raw: trimmed };
  }
  if (trimmed === "echo") {
    return { name: "echo", args: [], raw: trimmed };
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
  /** Current directory path for context-aware completion */
  currentPath: string;
}

export function getCommandCompletions(
  partial: string,
  context: CompletionContext,
): string[] {
  const endsWithSpace = /\s$/.test(partial);
  const trimmed = partial.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);

  // Complete command name (still typing the command, no trailing space)
  if (parts.length === 0) {
    return [...VALID_COMMANDS];
  }
  if (parts.length === 1 && !endsWithSpace) {
    return VALID_COMMANDS.filter((cmd) => cmd.startsWith(trimmed));
  }

  const cmd = parts[0];
  const argPartial = endsWithSpace ? "" : parts.slice(1).join(" ");

  // Complete arguments based on command
  if (cmd === "cat") {
    const segments =
      context.currentPath === "~"
        ? []
        : context.currentPath.replace("~/", "").split("/");
    if (segments.length > 0) {
      // Inside a category: only suggest slugs in this directory
      const categorySlugs = context.slugs.filter((_s, i) =>
        context.pathEntries[i]?.startsWith(`${segments[0]}/`),
      );
      return categorySlugs.filter((s) => s.startsWith(argPartial));
    }
    // At home: suggest "about" and category/slug paths (not bare slugs)
    const options = ["about", ...context.pathEntries];
    return options.filter((s) => s.startsWith(argPartial));
  }
  if (cmd === "cd" || cmd === "ls") {
    const dirs = ["~", "..", ...context.dirs];
    return dirs.filter((d) => d.startsWith(argPartial));
  }
  if (cmd === "grep") {
    return [];
  }

  return [];
}

export { VALID_COMMANDS };
