import { apiServerFetch } from "@/lib/api.server";
import type { WorkshopSettingsResponse } from "./types";

/**
 * Fetches settings for the authenticated workshop from a Server Component.
 */
export function getWorkshopSettings(): Promise<WorkshopSettingsResponse> {
  return apiServerFetch<WorkshopSettingsResponse>("/workshop/settings");
}