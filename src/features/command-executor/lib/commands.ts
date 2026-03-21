import type { CommandResult, ParsedCommand } from "@/entities/command";
import type { VirtualFS } from "@/entities/file-system";
import { getPathSegments, resolvePath } from "@/entities/file-system";
import type { Post } from "@/entities/post";
import { ASCII_BANNER } from "@/widgets/terminal/ui/ascii-banner";

const HELP_TEXT = `Available commands:

  help              Show this help message
  banner            Show welcome banner
  ls                List files in current directory
  cd <dir>          Change directory (cd dev, cd .., cd ~)
  cat <slug>        Read a blog post
  grep <keyword>    Search posts by keyword
  ask "<question>"  Ask AI about blog content
  about             Show profile information
  tags              List all tags
  whoami            Who are you?
  history           Show command history
  clear             Clear terminal

Keyboard shortcuts:
  Tab               Autocomplete
  ↑/↓               Navigate history
  Ctrl+A/E          Move cursor to start/end
  Ctrl+U            Delete line before cursor
  Ctrl+W            Delete word before cursor
  Ctrl+C            Cancel input
  Ctrl+L / Cmd+K    Clear screen`;

const ABOUT_TEXT = `
# About Me

**Aiden Ahn** (안승원)
Software Engineer

---

## Contact & Links
- GitHub: github.com/seungwonme
- Blog: seunan.dev

---

*Type 'ls' to browse posts, or 'ask "question"' to chat with AI.*
`;

function formatLsHome(fs: VirtualFS): string {
  const lines: string[] = [];
  for (const dir of fs.directories) {
    const count = fs.files.get(dir)?.length ?? 0;
    lines.push(
      `drwxr-xr-x  ${dir}/\t\t(${count} post${count !== 1 ? "s" : ""})`,
    );
  }
  lines.push("-rw-r--r--  about");
  return lines.join("\n");
}

function formatLsCategory(posts: Post[]): string {
  if (posts.length === 0) return "(empty directory)";
  return posts
    .map((p) => {
      const tags = p.tags.map((t) => `#${t}`).join(" ");
      return `-rw-r--r--  ${p.slug}\t${p.date}\t${tags}`;
    })
    .join("\n");
}

export function executeCommand(
  parsed: ParsedCommand,
  fs: VirtualFS,
  allPosts: Post[],
  commandHistory: string[],
): {
  result: CommandResult | null;
  newPath?: string;
  asyncAction?: "cat" | "ask" | "grep";
  asyncArg?: string;
} {
  if (!parsed.name) {
    return {
      result: {
        type: "error",
        content: `command not found: ${parsed.raw}. Type 'help' for available commands.`,
      },
    };
  }

  switch (parsed.name) {
    case "help":
      return { result: { type: "text", content: HELP_TEXT } };

    case "banner":
      return { result: { type: "banner", content: ASCII_BANNER } };

    case "clear":
      return { result: { type: "clear", content: "" } };

    case "whoami":
      return { result: { type: "text", content: "visitor" } };

    case "about":
      return { result: { type: "markdown", content: ABOUT_TEXT } };

    case "history": {
      if (commandHistory.length === 0) {
        return { result: { type: "text", content: "(no history)" } };
      }
      const lines = commandHistory
        .map((cmd, i) => `  ${String(i + 1).padStart(4)}  ${cmd}`)
        .join("\n");
      return { result: { type: "text", content: lines } };
    }

    case "tags": {
      const tagCounts = new Map<string, number>();
      for (const post of allPosts) {
        for (const tag of post.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
        }
      }
      if (tagCounts.size === 0) {
        return { result: { type: "text", content: "(no tags)" } };
      }
      const lines = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([tag, count]) => `  #${tag}\t(${count})`)
        .join("\n");
      return { result: { type: "text", content: lines } };
    }

    case "ls": {
      const segments = getPathSegments(fs.currentPath);
      if (segments.length === 0) {
        return {
          result: { type: "posts", content: formatLsHome(fs) },
        };
      }
      const category = segments[0];
      const posts = fs.files.get(category);
      if (!posts) {
        return {
          result: {
            type: "error",
            content: `ls: cannot access '${fs.currentPath}': No such directory`,
          },
        };
      }
      return {
        result: { type: "posts", content: formatLsCategory(posts) },
      };
    }

    case "cd": {
      const target = parsed.args[0];
      if (!target) {
        return { newPath: "~", result: null };
      }
      const newPath = resolvePath(fs.currentPath, target);
      if (newPath === "~") {
        return { newPath: "~", result: null };
      }
      const segments = getPathSegments(newPath);
      if (segments.length === 1 && fs.directories.includes(segments[0])) {
        return { newPath, result: null };
      }
      return {
        result: {
          type: "error",
          content: `cd: no such directory: ${target}`,
        },
      };
    }

    case "cat": {
      const arg = parsed.args[0];
      if (!arg) {
        return {
          result: { type: "error", content: "cat: missing operand" },
        };
      }
      // Support both "cat slug" and "cat category/slug"
      const slug = arg.includes("/") ? (arg.split("/").pop() ?? arg) : arg;
      return { asyncAction: "cat", asyncArg: slug, result: null };
    }

    case "grep": {
      const keyword = parsed.args.join(" ");
      if (!keyword) {
        return {
          result: { type: "error", content: "grep: missing pattern" },
        };
      }
      return { asyncAction: "grep", asyncArg: keyword, result: null };
    }

    case "ask": {
      const question = parsed.args.join(" ");
      if (!question) {
        return {
          result: {
            type: "error",
            content: 'ask: missing question. Usage: ask "your question"',
          },
        };
      }
      return { asyncAction: "ask", asyncArg: question, result: null };
    }

    default:
      return {
        result: {
          type: "error",
          content: `command not found: ${parsed.raw}. Type 'help' for available commands.`,
        },
      };
  }
}
