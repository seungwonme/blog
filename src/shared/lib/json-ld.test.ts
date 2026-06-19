import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JsonLd } from "@/shared/lib";

describe("JsonLd — </script> breakout / XSS hardening", () => {
  it("escapes < so injected markup cannot break out of the script tag", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "</script><script>alert(1)</script>",
    };

    const html = renderToStaticMarkup(
      createElement(JsonLd, { data: data as never }),
    );

    // The raw closing tag from attacker-controlled data must not survive...
    expect(html).not.toContain("</script><script>alert(1)");
    // ...because every `<` is emitted as a unicode escape inside the JSON.
    expect(html).toContain("\\u003c");
  });
});
