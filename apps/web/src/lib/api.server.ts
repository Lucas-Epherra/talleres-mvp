import { headers as nextHeaders } from "next/headers";
import { env } from "./env";
import { buildHeaders, parseApiResponse } from "./api";

/**
 * Resolves the API base URL for server-side requests.
 *
 * When the web proxies `/api/v1` through `API_PROXY_TARGET_URL` (staging and
 * preview deployments), the browser uses a relative URL that the server cannot
 * fetch, so the server talks to the proxy target directly.
 */
function getServerApiBaseUrl(): string {
  const proxyTargetUrl = process.env.API_PROXY_TARGET_URL?.replace(/\/$/, "");

  if (proxyTargetUrl) {
    return `${proxyTargetUrl}/api/v1`;
  }

  if (!/^https?:\/\//.test(env.apiBaseUrl)) {
    throw new Error(
      "NEXT_PUBLIC_API_URL must be absolute unless API_PROXY_TARGET_URL is set.",
    );
  }

  return env.apiBaseUrl;
}

/**
 * Performs a server-side API request and forwards the incoming cookie header.
 *
 * This is required because Server Components do not automatically forward
 * browser cookies to the backend API.
 */
export async function apiServerFetch<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const incomingHeaders = await nextHeaders();
  const headers = buildHeaders(options);
  const cookieHeader = incomingHeaders.get("cookie");

  if (cookieHeader && !headers.has("cookie")) {
    headers.set("cookie", cookieHeader);
  }

  const response = await fetch(`${getServerApiBaseUrl()}${path}`, {
    ...options,
    headers,
    cache: options.cache ?? "no-store",
  });

  return parseApiResponse<TResponse>(response);
}
