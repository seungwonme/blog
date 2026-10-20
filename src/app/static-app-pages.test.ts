import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

const publicRoot = resolve(import.meta.dirname, "../../public");
const documents = [
  "public/apps/hycli-social-test/index.html",
  "public/apps/hycli-social-test/terms.html",
  "public/apps/hycli-social-test/privacy.html",
];
const stylesheet = "public/apps/hycli-social-test/styles.css";
const site = "https://www.aidenahn.com";

describe("published app document contracts", () => {
  it("redirects the shared app URL to its public introduction", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toContainEqual({
      source: "/apps/hycli-social-test",
      destination: "/apps/hycli-social-test/index.html",
      permanent: true,
    });
  });

  it.each(
    documents,
  )("keeps the public URL and local links valid: %s", (file) => {
    const absoluteFile = resolve(publicRoot, file.replace(/^public\//, ""));
    const html = readFileSync(absoluteFile, "utf8");
    const publicUrl = new URL(file.replace(/^public\//, "/"), site);
    const canonical = html.match(
      /<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/,
    );
    expect(canonical?.[1]).toBe(publicUrl.href);

    for (const match of html.matchAll(/\bhref="([^"]+)"/g)) {
      const target = new URL(match[1], publicUrl);
      if (target.origin !== site) continue;
      const targetFile = resolve(publicRoot, `.${target.pathname}`);
      expect(existsSync(targetFile), `${file}: ${match[1]}`).toBe(true);
      if (target.hash) {
        const destination = readFileSync(targetFile, "utf8");
        expect(destination).toContain(`id="${target.hash.slice(1)}"`);
      }
    }

    const cssHref = html.match(
      /<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/,
    );
    expect(cssHref?.[1]).toBeDefined();
    expect(resolve(dirname(absoluteFile), cssHref?.[1] ?? "")).toBe(
      resolve(publicRoot, stylesheet.replace(/^public\//, "")),
    );
  });

  it("keeps the informational pages free of embedded collection and remote assets", () => {
    for (const file of documents) {
      const html = readFileSync(
        resolve(publicRoot, file.replace(/^public\//, "")),
        "utf8",
      );
      expect(html).not.toMatch(/<(?:script|form|iframe)\b/i);
    }
    const css = readFileSync(
      resolve(publicRoot, stylesheet.replace(/^public\//, "")),
      "utf8",
    );
    expect(css).not.toMatch(/@import\b|url\(/i);
  });
});
