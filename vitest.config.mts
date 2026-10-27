import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    alias: { "server-only": new URL("./tests/unit/server-only-stub.ts", import.meta.url).pathname },
  },
});
