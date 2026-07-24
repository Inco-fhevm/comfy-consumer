import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Report-Only until connect-src (RPC, indexer, Inco) is verified in-app, then enforce
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Pin file-tracing to this app; avoids picking a stray parent lockfile
  outputFileTracingRoot: __dirname,
  // standalone only for Docker; Vercel uses native output
  output: process.env.VERCEL ? undefined : "standalone",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  webpack: (config, { webpack }) => {
    config.module.rules.push({
      test: /HeartbeatWorker\.js$/,
      type: "javascript/esm",
    });
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    config.plugins.push(
      new webpack.IgnorePlugin({ resourceRegExp: /^@x402\// })
    );
    return config;
  },
  transpilePackages: [
    "@comfy/config",
    "@walletconnect/universal-provider",
    "@walletconnect/ethereum-provider",
    "@walletconnect/core",
  ],
};

export default nextConfig;