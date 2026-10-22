/**
 * Centralized frontend environment configuration.
 *
 * NEXT_PUBLIC_API_URL must point to the NestJS API base URL.
 * Example: http://localhost:3001/api/v1
 *
 * It can be the relative `/api/v1` when API_PROXY_TARGET_URL is set, so the
 * browser goes through the Next.js rewrite and the auth cookie stays on the
 * web host (staging and preview deployments).
 */
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiBaseUrl) {
  throw new Error("Missing required environment variable: NEXT_PUBLIC_API_URL");
}

export const env = {
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ""),
} as const;
