import { describe, expect, it } from "vitest";
import {
  getAllEntries,
  getCategories,
  getEntryByCategoryAndSlug,
  getEntryBySlug,
} from "@/entities/post";

// These run against the real generated posts.json (built by predev/prebuild),
// so assertions are written to be robust to content changes.
describe("post entity resolvers", () => {
  it("getAllEntries returns entries sorted by date descending", () => {
    const all = getAllEntries();
    expect(all.length).toBeGreaterThan(0);
    for (let i = 1; i < all.length; i++) {
      expect(all[i - 1].date >= all[i].date).toBe(true);
    }
  });

  it("getCategories returns lowercase, unique, sorted categories", () => {
    const cats = getCategories();
    expect(cats).toContain("digest");
    expect(cats.every((c) => c === c.toLowerCase())).toBe(true);
    expect(cats).toEqual([...cats].sort());
    expect(new Set(cats).size).toBe(cats.length);
  });

  it("getEntryBySlug resolves posts and digests (semantic-search resolver fix)", () => {
    const sample = getAllEntries()[0];
    expect(getEntryBySlug(sample.slug)?.slug).toBe(sample.slug);
    expect(getEntryBySlug("definitely-not-a-real-slug")).toBeNull();
  });

  it("getEntryByCategoryAndSlug matches category case-insensitively", () => {
    const sample = getAllEntries()[0];
    const resolved = getEntryByCategoryAndSlug(
      sample.category.toUpperCase(),
      sample.slug,
    );
    expect(resolved?.slug).toBe(sample.slug);
  });
});
