import { apiFetch } from "@/lib/api";
import type {
  AcceptPlatformInvitationInput,
  AcceptPlatformInvitationResponse,
  CreatePlatformInvitationInput,
  CreatePlatformInvitationResponse,
  CreatePlatformWorkshopInput,
  CreatePlatformWorkshopResponse,
  RevokePlatformInvitationResponse,
  ResendPlatformInvitationResponse,
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
 * The invitation link is sent by email when email delivery is enabled.
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

/**
 * Revokes a pending invitation.
 */
export function revokePlatformInvitation(
  invitationId: string,
): Promise<RevokePlatformInvitationResponse> {
  return apiFetch<RevokePlatformInvitationResponse>(
    `/platform/invitations/${invitationId}/revoke`,
    {
      method: "POST",
    },
  );
}

/**
 * Resends a pending or expired invitation with a fresh token.
 */
export function resendPlatformInvitation(
  invitationId: string,
): Promise<ResendPlatformInvitationResponse> {
  return apiFetch<ResendPlatformInvitationResponse>(
    `/platform/invitations/${invitationId}/resend`,
    {
      method: "POST",
    },
  );
}

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