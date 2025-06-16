/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  trailingSlash: true,

  env: {
    NEXT_PUBLIC_REOWN_APP_ID: process.env.REOWN_APP_ID,
  },

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

  // Transpile WalletConnect packages to fix SSR issues
  transpilePackages: [
    "@walletconnect/universal-provider",
    "@walletconnect/ethereum-provider",
    "@walletconnect/core",
  ],

  // Experimental features to help with SSR
  experimental: {
    esmExternals: "loose",
  },
};

export default nextConfig;
