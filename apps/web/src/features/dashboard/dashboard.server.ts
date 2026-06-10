import { apiServerFetch } from "../../lib/api.server";
import type { DashboardSummary } from "./types";

/**
 * Fetches the authenticated workshop dashboard summary.
 *
 * This function runs on the server and relies on apiServerFetch to forward the
 * incoming httpOnly cookie to the backend API.
 */
export function getDashboardSummary(): Promise<DashboardSummary> {
  return apiServerFetch<DashboardSummary>("/dashboard/summary");
}