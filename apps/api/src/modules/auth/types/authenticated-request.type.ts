import { Request } from 'express';
import { AuthUser } from './auth-user.type';

/**
 * Express request extended with the authenticated user context.
 */
export type AuthenticatedRequest = Request & {
  user: AuthUser;
};
