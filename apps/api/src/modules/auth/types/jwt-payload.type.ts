import { WorkshopRole } from '@prisma/client';

/**
 * Payload stored inside the signed access token.
 */
export type JwtPayload = {
  sub: string;
  workshopId: string;
  role: WorkshopRole;
};