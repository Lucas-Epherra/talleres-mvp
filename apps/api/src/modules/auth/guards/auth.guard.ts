import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AuthenticatedRequest } from '../types/authenticated-request.type';

const ACCESS_TOKEN_COOKIE_NAME = 'access_token';

/**
 * Protects routes by validating the access token from an httpOnly cookie.
 *
 * Bearer tokens are useful for local API testing, but should not be accepted in
 * production unless explicitly enabled.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  /**
   * Validates the request token and attaches the authenticated user to request.user.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token de acceso faltante.');
    }

    const payload = await this.authService.verifyAccessToken(token);
    const user = await this.authService.getCurrentUser(payload);

    request.user = user;

    return true;
  }

  /**
   * Reads the token from the httpOnly cookie first.
   *
   * Authorization Bearer is only accepted outside production or when explicitly
   * enabled with AUTH_ALLOW_BEARER_TOKENS=true.
   */
  private extractToken(request: AuthenticatedRequest): string | null {
    const cookieToken = this.extractCookieToken(request);

    if (cookieToken) {
      return cookieToken;
    }

    if (!this.shouldAllowBearerTokens()) {
      return null;
    }

    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      return null;
    }

    const [scheme, token, ...rest] = authorizationHeader.split(' ');

    if (
      rest.length > 0 ||
      scheme.toLowerCase() !== 'bearer' ||
      !token?.trim()
    ) {
      return null;
    }

    return token;
  }

  /**
   * Safely extracts the access token from cookie-parser output.
   */
  private extractCookieToken(request: AuthenticatedRequest): string | null {
    const cookies: unknown = request.cookies;

    if (!cookies || typeof cookies !== 'object') {
      return null;
    }

    const token = (cookies as Record<string, unknown>)[
      ACCESS_TOKEN_COOKIE_NAME
    ];

    if (typeof token === 'string' && token.trim()) {
      return token;
    }

    return null;
  }

  /**
   * Allows Bearer tokens only for local tooling unless explicitly enabled.
   */
  private shouldAllowBearerTokens(): boolean {
    return (
      process.env.NODE_ENV !== 'production' ||
      process.env.AUTH_ALLOW_BEARER_TOKENS === 'true'
    );
  }
}
