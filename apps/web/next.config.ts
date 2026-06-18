import type { NextConfig } from "next";

const apiProxyTargetUrl = process.env.API_PROXY_TARGET_URL?.replace(/\/$/, "");

/**
 * Next.js runtime configuration.
 *
 * In production/staging we proxy `/api/v1/*` through the web domain so the
 * httpOnly auth cookie belongs to the frontend host. This keeps Server
 * Components compatible with cookie-based authentication when the NestJS API is
 * deployed on a different infrastructure provider.
 */
const nextConfig: NextConfig = {
  async rewrites() {
    if (!apiProxyTargetUrl) {
      return [];
    }

    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiProxyTargetUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;