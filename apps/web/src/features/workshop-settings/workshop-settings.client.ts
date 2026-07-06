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

/**
 * Uploads and replaces the authenticated workshop logo.
 */
export function uploadWorkshopLogo(file: File): Promise<WorkshopSettingsResponse> {
  const formData = new FormData();

  formData.set("logo", file);

  return apiFetch<WorkshopSettingsResponse>("/workshop/settings/logo", {
    method: "POST",
    body: formData,
  });
}

/**
 * Deletes the authenticated workshop logo.
 */
export function deleteWorkshopLogo(): Promise<WorkshopSettingsResponse> {
  return apiFetch<WorkshopSettingsResponse>("/workshop/settings/logo", {
    method: "DELETE",
  });
}
