import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AuthenticatedRequest } from '../types/authenticated-request.type';

/**
 * Protects routes by validating the access token from cookies or Authorization header.
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
      throw new UnauthorizedException('Missing access token.');
    }

    const payload = await this.authService.verifyAccessToken(token);
    const user = await this.authService.getCurrentUser(payload);

    request.user = user;

    return true;
  }

  /**
   * Reads the token from httpOnly cookie first, then falls back to Bearer header.
   */
  private extractToken(request: AuthenticatedRequest): string | null {
    const cookieToken = request.cookies?.access_token as string | undefined;

    if (cookieToken) {
      return cookieToken;
    }

    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      return null;
    }

    const [scheme, token] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}