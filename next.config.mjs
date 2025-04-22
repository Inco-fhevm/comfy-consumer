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
  
  // Add trace configuration to exclude problematic directories
  experimental: {
    // Keep optimizeCss since we have critters installed in the pipeline
    optimizeCss: true,
    turbotrace: {
      logLevel: "error",
      // Add these trace exclusions to prevent copying the entire project directory
      contextDirectory: process.cwd(),
      traceFn: (file, opts) => {
        // Exclude node_modules and some root folders from tracing
        if (
          file.includes('node_modules') || 
          file === process.cwd() ||  // Exclude the root directory itself
          file.includes('.git') ||
          file.includes('.next')
        ) {
          return [];
        }
        return undefined; // Use default tracing for other files
      }
    },
  },
  
  // Keep the other configurations
  images: {
    domains: [],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  eslint: {
    ignoreDuringBuilds: true,
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