import type { NextFunction, Request, RequestHandler, Response } from 'express';

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000'];
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Reads allowed frontend origins from environment variables.
 *
 * CORS must never use wildcard origin when credentials/cookies are enabled.
 */
export function getAllowedOrigins(): string[] {
  const rawOrigins =
    process.env.CORS_ALLOWED_ORIGINS ?? process.env.FRONTEND_URL ?? '';

  const origins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : DEFAULT_ALLOWED_ORIGINS;
}

/**
 * Allows browser requests only from configured origins.
 *
 * Requests without Origin are allowed because they usually come from curl,
 * Postman, health checks or server-to-server calls.
 */
export function isOriginAllowed(
  requestOrigin: string | undefined,
  allowedOrigins: string[],
): boolean {
  if (!requestOrigin) {
    return true;
  }

  return allowedOrigins.includes(requestOrigin);
}

/**
 * Reads how many reverse proxies sit in front of the API.
 *
 * Express only trusts X-Forwarded-For when this is set, so req.ip (used by the
 * login rate limiter) is the real client and not the proxy. Trusting more hops
 * than really exist lets clients spoof their IP, so it defaults to 0.
 */
export function getTrustProxyHops(): number {
  const rawValue = process.env.TRUST_PROXY_HOPS?.trim();

  if (!rawValue) {
    return 0;
  }

  const hops = Number(rawValue);

  if (!Number.isInteger(hops) || hops < 0 || hops > 5) {
    throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 5.');
  }

  return hops;
}

/**
 * Rejects state-changing requests coming from origins outside the allowlist.
 *
 * CSRF defense that does not depend on the cookie SameSite mode: browsers send
 * Origin on cross-origin POST/PATCH/PUT/DELETE, including plain HTML forms.
 * When Origin is missing, Sec-Fetch-Site still exposes cross-site requests.
 * Non-browser clients send neither header and are not affected.
 */
export function createOriginCheckMiddleware(
  allowedOrigins: string[],
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      next();
      return;
    }

    const origin = req.headers.origin;
    const isAllowed = origin
      ? allowedOrigins.includes(origin)
      : req.headers['sec-fetch-site'] !== 'cross-site';

    if (isAllowed) {
      next();
      return;
    }

    res.status(403).json({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Origen no permitido.',
    });
  };
}
