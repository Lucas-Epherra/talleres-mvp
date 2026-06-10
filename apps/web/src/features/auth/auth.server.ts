import { cache } from "react";
import { ApiError } from "../../lib/api";
import { apiServerFetch } from "../../lib/api.server";
import type { AuthResponse, AuthUser } from "./types";

/**
 * Returns the authenticated user from the backend using the httpOnly cookie.
 *
 * Returns null when the user is not authenticated.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  try {
    const response = await apiServerFetch<AuthResponse>("/auth/me");

    return response.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
});