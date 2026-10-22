import * as Sentry from "@sentry/nextjs";

/**
 * Server-side error monitoring (Node.js and Edge runtimes).
 *
 * Disabled when SENTRY_DSN is unset. Only errors are sent: tracing stays off
 * to keep the free plan quota for errors.
 */
export function register(): void {
  const dsn = process.env.SENTRY_DSN?.trim();

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV,
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });
}

/**
 * Reports errors thrown while rendering Server Components, route handlers and
 * server actions.
 */
export const onRequestError = Sentry.captureRequestError;
