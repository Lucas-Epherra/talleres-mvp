/**
 * Centralized frontend environment configuration.
 *
 * NEXT_PUBLIC_API_URL must point to the NestJS API base URL.
 * Example: http://localhost:3001/api/v1
 */
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiBaseUrl) {
  throw new Error("Missing required environment variable: NEXT_PUBLIC_API_URL");
}

export const env = {
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ""),
} as const;
