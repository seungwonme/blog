import { describe, expect, it } from "vitest";
import {
  buildFileSystem,
  formatPrompt,
  getPathSegments,
  resolvePath,
} from "@/entities/file-system";

const entries = [
  { slug: "a", title: "A", category: "Dev" },
  { slug: "b", title: "B", category: "dev" },
  { slug: "c", title: "C", category: "Digest" },
];

describe("buildFileSystem", () => {
  it("groups entries by lowercased category and sorts directories", () => {
    const fs = buildFileSystem(entries);
    expect(fs.directories).toEqual(["dev", "digest"]);
    expect(fs.files.get("dev")).toHaveLength(2);
    expect(fs.files.get("digest")).toHaveLength(1);
    expect(fs.currentPath).toBe("~");
  });
});

describe("resolvePath", () => {
  it("resolves home and root to ~", () => {
    expect(resolvePath("~/dev", "~")).toBe("~");
    expect(resolvePath("~/dev", "/")).toBe("~");
  });

  it("goes back up to home on ..", () => {
    expect(resolvePath("~/dev", "..")).toBe("~");
    expect(resolvePath("~", "..")).toBe("~");
  });

  it("joins a relative target onto the current path", () => {
    expect(resolvePath("~", "dev")).toBe("~/dev");
    expect(resolvePath("~/dev", "foo")).toBe("~/dev/foo");
  });

  it("honours an absolute ~/ target", () => {
    expect(resolvePath("~/dev", "~/digest")).toBe("~/digest");
  });
});

describe("getPathSegments", () => {
  it("returns an empty array for home", () => {
    expect(getPathSegments("~")).toEqual([]);
  });

  it("splits a path into segments", () => {
    expect(getPathSegments("~/dev")).toEqual(["dev"]);
    expect(getPathSegments("~/dev/foo")).toEqual(["dev", "foo"]);
  });
});

describe("formatPrompt", () => {
  it("renders the visitor prompt for a path", () => {
    expect(formatPrompt("~")).toBe("visitor@aidenahn.com:~$");
    expect(formatPrompt("~/dev")).toBe("visitor@aidenahn.com:~/dev$");
  });
});
