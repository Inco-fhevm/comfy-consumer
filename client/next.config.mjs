/** @type {import('next').NextConfig} */
const nextConfig = {
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
    // @x402/* are OPTIONAL peer deps of @coinbase/cdp-sdk (x402 payments), pulled
    // in transitively by the Base wallet connector and never used here. They
    // aren't installed, so stop webpack from failing on the unresolved imports.
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