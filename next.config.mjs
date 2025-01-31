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
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "tfhe_bg.wasm": path.resolve(__dirname, "node_modules/tfhe/tfhe_bg.wasm"),
    };
    return config;
  },
};

export default withPWA(nextConfig);
