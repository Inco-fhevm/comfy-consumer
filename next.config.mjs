/** @type {import('next').NextConfig} */
import withPWAInit from "@ducanh2912/next-pwa";
import path from "path";
import { fileURLToPath } from "url";

const withPWA = withPWAInit({
  dest: "public",
});

// Get the directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  output: 'standalone', // Ensures the standalone output format is used
  images: {
    domains: [
      // Add your image domains here if needed
    ],
    // Special handling for SVGs since they appear to be your main image type
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  eslint: {
    // Warning during build but don't fail
    ignoreDuringBuilds: true,
  },
  experimental: {
    turbotrace: {
      logLevel: "error",
    },
    optimizeCss: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "tfhe_bg.wasm": path.resolve(__dirname, "node_modules/tfhe/tfhe_bg.wasm"),
    };
    
    // Cache optimization
    config.cache = true;
    
    return config;
  },
};

export default withPWA(nextConfig);