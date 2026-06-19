import { describe, expect, it } from "vitest";
import { parseCommand } from "@/entities/command";
import { buildFileSystem } from "@/entities/file-system";
import type { PostMeta } from "@/entities/post";
import { executeCommand } from "@/features/command-executor";

const posts: PostMeta[] = [
  {
    title: "Hello World",
    slug: "hello-world",
    category: "dev",
    tags: ["ts", "terminal"],
    date: "2026-01-01",
    description: "first post",
  },
  {
    title: "Daily Digest",
    slug: "2026-06-19",
    category: "digest",
    tags: ["ai"],
    date: "2026-06-19",
    description: "a digest",
  },
];

const ABOUT = "About the author";

function run(input: string, currentPath = "~") {
  const fs = buildFileSystem(posts);
  fs.currentPath = currentPath;
  return executeCommand(parseCommand(input), fs, posts, [], ABOUT);
}

describe("executeCommand — ls", () => {
  it("lists home directories", () => {
    const { result } = run("ls");
    expect(result?.type).toBe("listing");
    expect(result?.content).toContain("dev/");
    expect(result?.content).toContain("digest/");
  });

  it("lists posts in a category", () => {
    const { result } = run("ls dev");
    expect(result?.type).toBe("listing");
    expect(result?.content).toContain("hello-world");
  });

  it("regression: ls is case-insensitive (ls DEV)", () => {
    const { result } = run("ls DEV");
    expect(result?.type).toBe("listing");
    expect(result?.content).toContain("hello-world");
  });

  it("errors on an unknown directory", () => {
    expect(run("ls nope").result?.type).toBe("error");
  });
});

describe("executeCommand — cd", () => {
  it("enters a directory and shows its listing", () => {
    const { newPath, result } = run("cd dev");
    expect(newPath).toBe("~/dev");
    expect(result?.type).toBe("listing");
  });

  it("regression: cd is case-insensitive and normalizes the path (cd DEV)", () => {
    const { newPath, result } = run("cd DEV");
    expect(newPath).toBe("~/dev");
    expect(result?.type).toBe("listing");
  });

  it("errors on an unknown directory", () => {
    expect(run("cd nope").result?.type).toBe("error");
  });
});

describe("executeCommand — cat", () => {
  it("returns about content for 'cat about'", () => {
    expect(run("cat about").result).toMatchObject({
      type: "markdown",
      content: ABOUT,
    });
  });

  it("resolves an explicit path to a cat async action", () => {
    const { asyncAction, asyncArg } = run("cat dev/hello-world");
    expect(asyncAction).toBe("cat");
    expect(asyncArg).toBe("hello-world");
  });

  it("regression: explicit cat path is case-insensitive (cat DEV/hello-world)", () => {
    const { asyncAction, asyncArg } = run("cat DEV/hello-world");
    expect(asyncAction).toBe("cat");
    expect(asyncArg).toBe("hello-world");
  });

  it("regression: cat inside an upper-case current dir resolves (~/DEV)", () => {
    const { asyncAction, asyncArg } = run("cat hello-world", "~/DEV");
    expect(asyncAction).toBe("cat");
    expect(asyncArg).toBe("hello-world");
  });

  it("errors on a missing file", () => {
    expect(run("cat dev/nope").result?.type).toBe("error");
  });
});

describe("executeCommand — misc commands", () => {
  it("help returns text", () => {
    expect(run("help").result?.type).toBe("text");
  });

  it("echo prints its payload", () => {
    expect(run("echo hi there").result?.content).toBe("hi there");
  });

  it("hostname is the site domain", () => {
    expect(run("hostname").result?.content).toBe("aidenahn.com");
  });

  it("email signals the mailto side effect", () => {
    expect(run("email").openMailto).toBe(true);
  });

  it("grep finds posts by tag/title/description", () => {
    const { result } = run("grep terminal");
    expect(result?.type).toBe("posts");
    expect(result?.content).toContain("hello-world");
  });

  it("ask returns an async ask action", () => {
    const { asyncAction, asyncArg } = run('ask "hello there"');
    expect(asyncAction).toBe("ask");
    expect(asyncArg).toBe("hello there");
  });

  it("unknown command returns an error", () => {
    expect(run("nope").result?.type).toBe("error");
  });
});
