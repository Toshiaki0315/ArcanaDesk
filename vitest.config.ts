import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/main.ts"],
      // CLAUDE.md の目標 (90% 以上) を下回ったら失敗させる
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
});
