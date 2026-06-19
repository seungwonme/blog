import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));
const serverOnlyStub = fileURLToPath(
  new URL("./test/empty-module.ts", import.meta.url),
);

export default defineConfig({
  resolve: {
    alias: [
      // `@/x` → src/x. 정확히 `@/`만 매칭해 `@google/...` 등 스코프 패키지는 건드리지 않는다.
      { find: /^@\/(.*)/, replacement: `${srcDir}/$1` },
      // `server-only`는 RSC 밖에서 throw하므로 Node 테스트용 no-op stub으로 치환.
      { find: "server-only", replacement: serverOnlyStub },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
