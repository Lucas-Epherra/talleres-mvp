import { apiFetch } from "../../lib/api";
import type { AuthResponse, LoginInput } from "./types";

type LogoutResponse = {
  message: string;
};

/**
 * Authenticates a user against the backend.
 *
 * The access token is stored by the backend as an httpOnly cookie.
 */
export function login(input: LoginInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Ends the current authenticated session.
 */
export function logout(): Promise<LogoutResponse> {
  return apiFetch<LogoutResponse>("/auth/logout", {
    method: "POST",
  });
}
