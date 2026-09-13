import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@raycast/api": path.resolve(import.meta.dirname, "./tests/mocks/raycast-api.ts"),
      "@raycast/utils": path.resolve(import.meta.dirname, "./tests/mocks/raycast-utils.ts"),
    },
  },
});
