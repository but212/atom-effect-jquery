/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "AtomEffectJQuery",
      formats: ["es", "cjs", "umd"],
      fileName: (format) => {
        if (format === "es") return "index.mjs";
        if (format === "cjs") return "index.cjs";
        return "index.umd.js";
      },
    },
    rollupOptions: {
      external: ["jquery", "@but212/atom-effect"],
      output: {
        exports: "named",
        globals: {
          jquery: "jQuery",
          "@but212/atom-effect": "AtomEffect",
        },
      },
    },
    sourcemap: true,
  },
  plugins: [dts({ rollupTypes: true })],
  test: {
    environment: "jsdom",
    setupFiles: ["./__tests__/setup.ts"],
  },
});
