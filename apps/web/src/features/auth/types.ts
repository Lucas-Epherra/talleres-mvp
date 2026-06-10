export type AuthRole = "OWNER" | "ADMIN" | "OPERATOR";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  workshopId: string;
  role: AuthRole;
};

export type AuthResponse = {
  user: AuthUser;
};

export type LoginInput = {
  email: string;
  password: string;
};