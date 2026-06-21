import { headers as nextHeaders } from "next/headers";
import { env } from "./env";
import { buildHeaders, parseApiResponse } from "./api";

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

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers,
    cache: options.cache ?? "no-store",
  });

  return parseApiResponse<TResponse>(response);
}
