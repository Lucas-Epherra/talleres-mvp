import { PlatformRole, WorkshopRole } from '@prisma/client';

/**
 * Payload stored inside the signed access token.
 *
 * `role` is the workshop role kept for compatibility with the current
 * workshop-first dashboard. `platformRole` enables platform-only authorization
 * checks in the next step.
 */
export type JwtPayload = {
  sub: string;
  workshopId: string;
  role: WorkshopRole;
  platformRole: PlatformRole;
};
