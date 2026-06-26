import { apiFetch } from "@/lib/api";
import type {
  CreatePlatformInvitationInput,
  CreatePlatformInvitationResponse,
  CreatePlatformWorkshopInput,
  CreatePlatformWorkshopResponse,
} from "./types";

/**
 * Creates a workshop account from the internal platform area.
 *
 * The backend enforces platform administrator authorization through the
 * httpOnly session cookie.
 */
export function createPlatformWorkshop(
  input: CreatePlatformWorkshopInput,
): Promise<CreatePlatformWorkshopResponse> {
  return apiFetch<CreatePlatformWorkshopResponse>("/platform/workshops", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Creates an access invitation for a workshop user.
 *
 * Email delivery is not enabled yet, so the setup token is returned for local
 * QA and the next invitation-acceptance step.
 */
export function createPlatformInvitation(
  workshopId: string,
  input: CreatePlatformInvitationInput,
): Promise<CreatePlatformInvitationResponse> {
  return apiFetch<CreatePlatformInvitationResponse>(
    `/platform/workshops/${workshopId}/invitations`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

import type {
  AcceptPlatformInvitationInput,
  AcceptPlatformInvitationResponse,
} from "./types";

/**
 * Accepts an invitation and creates workshop access for the invited user.
 */
export function acceptPlatformInvitation(
  input: AcceptPlatformInvitationInput,
): Promise<AcceptPlatformInvitationResponse> {
  return apiFetch<AcceptPlatformInvitationResponse>("/invitations/accept", {
    method: "POST",
    body: JSON.stringify(input),
  });
}