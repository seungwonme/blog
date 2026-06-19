import { describe, expect, it } from "vitest";
import { getCommandCompletions, parseCommand } from "@/entities/command";

describe("parseCommand", () => {
  it("returns a null command for blank input", () => {
    expect(parseCommand("   ")).toEqual({ name: null, args: [], raw: "" });
  });

  it("lowercases the command name", () => {
    expect(parseCommand("LS")).toMatchObject({ name: "ls", args: [] });
    expect(parseCommand("Help")).toMatchObject({ name: "help" });
  });

  it("splits args on whitespace", () => {
    expect(parseCommand("cat dev/foo")).toMatchObject({
      name: "cat",
      args: ["dev/foo"],
    });
  });

  it("parses ask with a quoted question, preserving inner spaces", () => {
    expect(parseCommand('ask "what is RAG?"')).toMatchObject({
      name: "ask",
      args: ["what is RAG?"],
    });
  });

  it("parses ask without quotes as a single arg", () => {
    expect(parseCommand("ask what is this")).toMatchObject({
      name: "ask",
      args: ["what is this"],
    });
  });

  it("preserves the full echo payload including inner spaces", () => {
    expect(parseCommand("echo  hello   world")).toMatchObject({
      name: "echo",
      args: ["hello   world"],
    });
    expect(parseCommand("echo")).toMatchObject({ name: "echo", args: [] });
  });

  it("returns null for an unknown command (no shell passthrough)", () => {
    expect(parseCommand("rm -rf /")).toMatchObject({ name: null });
    expect(parseCommand("sudo reboot")).toMatchObject({ name: null });
  });
});

describe("getCommandCompletions", () => {
  const ctx = {
    slugs: ["foo", "bar"],
    dirs: ["dev", "digest"],
    pathEntries: ["dev/foo", "digest/bar"],
    currentPath: "~",
  };

  it("completes command names by prefix", () => {
    expect(getCommandCompletions("c", ctx)).toEqual(
      expect.arrayContaining(["cd", "cat", "clear"]),
    );
  });

  it("suggests directories for cd/ls", () => {
    expect(getCommandCompletions("cd ", ctx)).toEqual(
      expect.arrayContaining(["~", "..", "dev", "digest"]),
    );
  });
});
