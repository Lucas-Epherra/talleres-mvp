import { WorkshopRole } from '@prisma/client';

/**
 * Authenticated user context extracted from the access token.
 */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  workshopId: string;
  role: WorkshopRole;
};