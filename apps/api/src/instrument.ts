import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN?.trim();

/**
 * Error monitoring. Must be imported before any other module in main.ts so
 * Sentry can instrument them.
 *
 * Disabled when SENTRY_DSN is unset (local, CI). Only errors are sent:
 * performance tracing stays off to keep the free plan quota for errors.
 */
if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend(event) {
      // Never ship credentials or request payloads (customer data) to Sentry.
      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;

        if (event.request.headers) {
          delete event.request.headers.cookie;
          delete event.request.headers.authorization;
        }
      }

      return event;
    },
  });
}
