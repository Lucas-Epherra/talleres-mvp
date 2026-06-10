import { env } from "./env";

type ApiErrorPayload = {
  message?: unknown;
  error?: unknown;
  statusCode?: unknown;
  [key: string]: unknown;
};

/**
 * Error thrown when the API responds with a non-2xx status code.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, payload: unknown) {
    super(getApiErrorMessage(payload));
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Performs a browser-side API request.
 *
 * credentials: "include" is mandatory because the backend stores auth inside
 * an httpOnly cookie.
 */
export async function apiFetch<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const headers = buildHeaders(options);

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  return parseApiResponse<TResponse>(response);
}

/**
 * Parses API responses and normalizes error handling.
 */
export async function parseApiResponse<TResponse>(
  response: Response,
): Promise<TResponse> {
  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new ApiError(response.status, payload);
  }

  return payload as TResponse;
}

/**
 * Builds default headers without breaking FormData uploads.
 */
export function buildHeaders(options: RequestInit): Headers {
  const headers = new Headers(options.headers);

  if (
    options.body &&
    shouldSetJsonContentType(options.body) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

function shouldSetJsonContentType(body: BodyInit): boolean {
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  return !isFormData;
}

async function readResponsePayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();

  if (!text) {
    return undefined;
  }

  const contentType = response.headers.get("Content-Type");

  if (contentType?.includes("application/json")) {
    return JSON.parse(text);
  }

  return text;
}

function getApiErrorMessage(payload: unknown): string {
  if (typeof payload === "string" && payload.length > 0) {
    return payload;
  }

  if (!isApiErrorPayload(payload)) {
    return "Unexpected API error.";
  }

  if (Array.isArray(payload.message)) {
    return payload.message.join(" ");
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }

  if (typeof payload.error === "string") {
    return payload.error;
  }

  return "Unexpected API error.";
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === "object" && value !== null;
}