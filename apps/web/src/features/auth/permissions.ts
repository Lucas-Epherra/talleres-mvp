import type { AuthRole, AuthUser } from "./types";

/**
 * Workshop roles allowed to run administrative actions: workshop settings and
 * logo, supplier payments, and cancelling or reopening work orders.
 *
 * Mirrors the `@Roles(OWNER, ADMIN)` routes in the API. This is only used to
 * hide controls in the UI; the API remains the source of truth and rejects
 * these requests for other roles.
 */
const WORKSHOP_MANAGER_ROLES: readonly AuthRole[] = ["OWNER", "ADMIN"];

/**
 * Returns whether the user can run administrative workshop actions.
 *
 * Accepts null so Server Components can pass `getCurrentUser()` directly.
 */
export function canManageWorkshop(user: AuthUser | null): boolean {
  return user !== null && WORKSHOP_MANAGER_ROLES.includes(user.workshopRole);
}
