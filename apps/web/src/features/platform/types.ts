import type { AuthRole } from "@/features/auth/types";

export type PlatformWorkshopStatus = "ACTIVE" | "DISABLED";

export type PlatformInvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REVOKED"
  | "EXPIRED";

export type PlatformWorkshop = {
  id: string;
  name: string;
  slug: string;
  status: PlatformWorkshopStatus;
  createdAt: string;
  updatedAt: string;
  counts: {
    members: number;
    customers: number;
    vehicles: number;
    workOrders: number;
    appointments: number;
  };
};

export type PlatformInvitation = {
  id: string;
  email: string;
  role: AuthRole;
  status: PlatformInvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
  workshop: {
    id: string;
    name: string;
    slug: string;
  };
  createdByUser: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type PlatformWorkshopsResponse = {
  data: PlatformWorkshop[];
};

export type PlatformInvitationsResponse = {
  data: PlatformInvitation[];
};

export type PlatformSummaryResponse = {
  workshops: {
    total: number;
    active: number;
    disabled: number;
  };
  users: {
    active: number;
    platformOwners: number;
    activeWorkshopMembers: number;
  };
  invitations: {
    pending: number;
  };
};

export type PlatformMeResponse = {
  user: {
    id: string;
    email: string;
    name: string;
    platformRole: "OWNER";
    status: "ACTIVE" | "DISABLED";
  };
  capabilities: string[];
};

export type CreatePlatformWorkshopInput = {
  name: string;
  slug?: string;
};

export type CreatePlatformWorkshopResponse = {
  data: PlatformWorkshop;
};

export type CreatePlatformInvitationInput = {
  email: string;
  role: AuthRole;
};

export type CreatePlatformInvitationResponse = {
  data: PlatformInvitation;
  setupToken: string;
};