import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "react/index": "src/react/index.ts",
    "ui/index": "src/ui/index.ts",
  },
  format: ["esm"],
  target: "es2022",
  platform: "neutral",
  dts: true,
  splitting: true,
  treeshake: true,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  external: [
    "viem",
    "@inco/lightning-js",
    "@inco/lightning-js/lite",
    "zod",
    "react",
    "react-dom",
    "react/jsx-runtime",
    "@tanstack/react-query",
    "wagmi",
    "motion",
    "motion/react",
  ],
  // Inline @comfy/config (addresses + JSON ABIs) so the SDK is self-contained.
  noExternal: ["@comfy/config"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
  // "use client" is re-applied post-build (see scripts/preserve-use-client.mjs),
  // since esbuild strips module-level directives when bundling.
});
