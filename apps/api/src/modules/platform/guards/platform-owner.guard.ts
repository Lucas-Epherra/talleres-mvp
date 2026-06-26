import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import { AuthenticatedRequest } from '../../auth/types/authenticated-request.type';

/**
 * Allows access only to authenticated platform owners.
 *
 * This guard must run after AuthGuard because it relies on request.user being
 * attached by the authentication layer.
 */
@Injectable()
export class PlatformOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || user.platformRole !== PlatformRole.OWNER) {
      throw new ForbiddenException(
        'No tenés permisos para administrar la plataforma.',
      );
    }

    return true;
  }
}
