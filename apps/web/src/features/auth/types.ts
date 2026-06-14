export type AuthRole = "OWNER" | "ADMIN" | "OPERATOR";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  workshopId: string;
  role: AuthRole;
};

export type AuthWorkshop = {
  id: string;
  name: string;
  slug: string;
};

export type AuthResponse = {
  user: AuthUser;
  workshop: AuthWorkshop;
};

export type LoginInput = {
  email: string;
  password: string;
};