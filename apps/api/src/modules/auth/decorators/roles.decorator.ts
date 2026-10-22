import { SetMetadata } from '@nestjs/common';
import { WorkshopRole } from '@prisma/client';

export const ROLES_METADATA_KEY = 'workshopRoles';

/**
 * Restricts a route or controller to the given workshop roles.
 *
 * Requires RolesGuard to run after AuthGuard. Method-level roles override
 * controller-level roles. Routes without this decorator stay open to every
 * active member of the workshop.
 */
export const Roles = (...roles: WorkshopRole[]) =>
  SetMetadata(ROLES_METADATA_KEY, roles);
