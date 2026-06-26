export type AuthRole = "OWNER" | "ADMIN" | "OPERATOR";

export type AuthPlatformRole = "NONE" | "OWNER";

export type AuthUserStatus = "ACTIVE" | "DISABLED";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  workshopId: string;
  platformRole: AuthPlatformRole;
  status: AuthUserStatus;
  workshopRole: AuthRole;
  /**
   * Backward-compatible alias used by existing workshop screens.
   */
  role: AuthRole;
};

export type AuthWorkshop = {
  id: string;
  name: string;
  slug: string;
  status?: "ACTIVE" | "DISABLED";
};

export type AuthResponse = {
  user: AuthUser;
  workshop: AuthWorkshop;
};

export type LoginInput = {
  email: string;
  password: string;
};