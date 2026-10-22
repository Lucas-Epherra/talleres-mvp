import type { ThrottlerModuleOptions } from '@nestjs/throttler';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

/**
 * Max login attempts per client IP inside the window.
 *
 * Kept higher than the per-email limit because several employees of the same
 * workshop usually share one public IP.
 */
export const LOGIN_IP_LIMIT = 20;

/**
 * Max login attempts per email inside the window.
 */
export const LOGIN_EMAIL_LIMIT = 5;

export const LOGIN_THROTTLE_MESSAGE =
  'Demasiados intentos de inicio de sesión. Esperá unos minutos e intentá nuevamente.';

/**
 * Tracks login attempts by normalized email.
 *
 * Guards run before ValidationPipe, so the raw body is normalized here the same
 * way LoginDto does. Requests without a usable email fall back to the IP.
 */
export function getLoginEmailTracker(req: Record<string, unknown>): string {
  const body = req.body as Record<string, unknown> | undefined;
  const rawEmail = body?.email;

  if (typeof rawEmail === 'string' && rawEmail.trim()) {
    return `email:${rawEmail.trim().toLowerCase().slice(0, 254)}`;
  }

  return `ip:${String(req.ip)}`;
}

/**
 * Throttler configuration used only by routes decorated with ThrottlerGuard.
 *
 * Storage is in-memory: limits are per API instance and reset on restart.
 * Move to a shared store (Redis) before running more than one instance.
 */
export const LOGIN_THROTTLER_OPTIONS: ThrottlerModuleOptions = {
  errorMessage: LOGIN_THROTTLE_MESSAGE,
  throttlers: [
    {
      name: 'login-ip',
      ttl: FIFTEEN_MINUTES_MS,
      limit: LOGIN_IP_LIMIT,
    },
    {
      name: 'login-email',
      ttl: FIFTEEN_MINUTES_MS,
      limit: LOGIN_EMAIL_LIMIT,
      getTracker: getLoginEmailTracker,
    },
  ],
};
