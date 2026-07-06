import { apiFetch } from "@/lib/api";
import type {
  UpdateWorkshopSettingsInput,
  WorkshopSettingsResponse,
} from "./types";

/**
 * Updates settings for the authenticated workshop from a leaf Client Component.
 */
export function updateWorkshopSettings(
  input: UpdateWorkshopSettingsInput,
): Promise<WorkshopSettingsResponse> {
  return apiFetch<WorkshopSettingsResponse>("/workshop/settings", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}