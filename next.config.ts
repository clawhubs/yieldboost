import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  webpack: (config, { isServer }) => {
    // Suppress E2B dynamic import warning
    config.module = config.module || {};
    config.module.unknownContextCritical = false;
    config.module.unknownContextRegExp = /$^/;
    config.module.exprContextCritical = false;
    config.module.exprContextRegExp = /$^/;
    return config;
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Suppress Upstash Edge Runtime warning (app uses Node.js runtime)
  serverExternalPackages: ['@upstash/redis', '@upstash/ratelimit'],
};

export default nextConfig;
