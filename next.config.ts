import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't use "standalone" output on Vercel — Vercel handles the server.
  // (Uncomment this only for Docker / self-hosted deployments.)
  // output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Linting is run separately via `bun run lint` — don't block production builds
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
