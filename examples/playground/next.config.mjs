import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  // The repo root (stray ~/package-lock.json otherwise confuses detection).
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  // @comfy/sdk keeps @inco/lightning-js external — the same webpack
  // workarounds the main client uses are required here.
  webpack: (config, { webpack }) => {
    // pnpm can install a second wagmi/react-query for the SDK (peer-hash
    // mismatch) → duplicate React context. Pin both to the app's copy.
    config.resolve.alias = {
      ...config.resolve.alias,
      wagmi$: require.resolve("wagmi"),
      "@tanstack/react-query$": require.resolve("@tanstack/react-query"),
    };
    config.module.rules.push({ test: /HeartbeatWorker\.js$/, type: "javascript/esm" });
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    // Resolves @inco/lightning-js's extensionless ESM imports.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^@x402\// }));
    return config;
  },
  transpilePackages: [
    "@walletconnect/universal-provider",
    "@walletconnect/ethereum-provider",
    "@walletconnect/core",
  ],
};

export default nextConfig;
