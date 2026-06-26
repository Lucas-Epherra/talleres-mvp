import { PlatformRole, UserStatus, WorkshopRole } from '@prisma/client';

/**
 * Authenticated user context extracted from the access token and database.
 *
 * `role` is kept as a backward-compatible alias for the workshop role because
 * existing operational modules still consume `user.role`.
 */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  platformRole: PlatformRole;
  status: UserStatus;
  workshopId: string;
  workshopRole: WorkshopRole;
  role: WorkshopRole;
};
