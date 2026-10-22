import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkshopRole } from '@prisma/client';
import { ROLES_METADATA_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequest } from '../types/authenticated-request.type';

/**
 * Enforces workshop roles declared with @Roles.
 *
 * This guard must run after AuthGuard because it relies on request.user being
 * attached by the authentication layer. The role comes from the active
 * membership loaded from the database, not from the token payload, so role
 * changes apply on the next request.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      WorkshopRole[] | undefined
    >(ROLES_METADATA_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.workshopRole)) {
      throw new ForbiddenException(
        'No tenés permisos para realizar esta acción.',
      );
    }

    return true;
  }
}
