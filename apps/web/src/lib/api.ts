import { env } from "./env";

type ApiErrorPayload = {
  message?: unknown;
  error?: unknown;
  statusCode?: unknown;
  [key: string]: unknown;
};

const apiStatusFallbackMessages: Record<number, string> = {
  400: "Hay datos inválidos. Revisá el formulario e intentá nuevamente.",
  401: "Tu sesión expiró. Volvé a iniciar sesión.",
  403: "No tenés permisos para realizar esta acción.",
  404: "El recurso no existe o ya no está disponible.",
  409: "Ya existe un registro con esos datos.",
  500: "Ocurrió un error interno. Intentá nuevamente en unos minutos.",
};

/**
 * Error thrown when the API responds with a non-2xx status code.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, payload: unknown) {
    super(getApiErrorMessage(payload, status));
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

/**
 * Converts unknown thrown errors into safe, user-facing form messages.
 */
export function getApiErrorMessage(
  errorOrPayload: unknown,
  status?: number,
): string {
  if (errorOrPayload instanceof ApiError) {
    return getApiErrorMessage(errorOrPayload.payload, errorOrPayload.status);
  }

  if (typeof errorOrPayload === "string" && errorOrPayload.trim().length > 0) {
    return errorOrPayload.trim();
  }

  if (!isApiErrorPayload(errorOrPayload)) {
    return getFallbackMessage(status);
  }

  const message = normalizeApiMessage(errorOrPayload.message);

  if (message) {
    return message;
  }

  if (
    typeof errorOrPayload.error === "string" &&
    errorOrPayload.error.trim().length > 0
  ) {
    return errorOrPayload.error.trim();
  }

  return getFallbackMessage(status);
}

/**
 * Checks whether an unknown error is an API error with a specific HTTP status.
 */
export function isApiErrorWithStatus(
  error: unknown,
  status: number,
): error is ApiError {
  return error instanceof ApiError && error.status === status;
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

  if (!contentType?.includes("application/json")) {
    return text;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function normalizeApiMessage(message: unknown): string | null {
  if (Array.isArray(message)) {
    const normalizedMessages = message
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);

    if (normalizedMessages.length === 0) {
      return null;
    }

    return [...new Set(normalizedMessages)].join(" ");
  }

  if (typeof message === "string" && message.trim().length > 0) {
    return message.trim();
  }

  return null;
}

function getFallbackMessage(status?: number): string {
  if (status && apiStatusFallbackMessages[status]) {
    return apiStatusFallbackMessages[status];
  }

  return "Ocurrió un error inesperado. Intentá nuevamente.";
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === "object" && value !== null;
}
