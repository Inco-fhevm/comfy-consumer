/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  trailingSlash: true,
  experimental: {
    esmExternals: "loose",
    skipTrailingSlashRedirect: true,
  },
  webpack: (config) => {
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
    return config;
  },
  transpilePackages: [
    "@walletconnect/universal-provider",
    "@walletconnect/ethereum-provider",
    "@walletconnect/core",
  ],
};

export default nextConfig;