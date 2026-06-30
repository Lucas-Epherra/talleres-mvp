import type { AuthRole } from "@/features/auth/types";

export type PlatformWorkshopStatus = "ACTIVE" | "DISABLED" | "ARCHIVED";

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
  archivedAt: string | null;
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
  archivedAt: string | null;
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

export type PlatformMembershipStatus = "ACTIVE" | "DISABLED";

export type PlatformUserStatus = "ACTIVE" | "DISABLED";

export type PlatformUser = {
  membershipId: string;
  role: AuthRole;
  status: PlatformMembershipStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    status: PlatformUserStatus;
    createdAt: string;
    updatedAt: string;
  };
  workshop: {
    id: string;
    name: string;
    slug: string;
    status: PlatformWorkshopStatus;
  };
};

export type PlatformAuditAction =
  | "WORKSHOP_CREATED"
  | "WORKSHOP_DISABLED"
  | "WORKSHOP_ENABLED"
  | "WORKSHOP_ARCHIVED"
  | "WORKSHOP_RESTORED"
  | "INVITATION_CREATED"
  | "INVITATION_REVOKED"
  | "INVITATION_RESENT"
  | "INVITATION_ARCHIVED"
  | "USER_ACCESS_DISABLED"
  | "USER_ACCESS_ENABLED"
  | "USER_ROLE_UPDATED";

export type PlatformAuditEntityType = "WORKSHOP" | "INVITATION" | "USER_ACCESS";

export type PlatformAuditLog = {
  id: string;
  action: PlatformAuditAction;
  entityType: PlatformAuditEntityType;
  entityId: string;
  workshopId: string | null;
  summary: string;
  metadata: unknown;
  createdAt: string;
  actorUser: {
    id: string;
    name: string;
    email: string;
  };
  workshop: {
    id: string;
    name: string;
    slug: string;
    status: PlatformWorkshopStatus;
  } | null;
};

export type PlatformAuditLogsResponse = {
  data: PlatformAuditLog[];
};

export type PlatformWorkshopsResponse = {
  data: PlatformWorkshop[];
};

export type PlatformInvitationsResponse = {
  data: PlatformInvitation[];
};

export type PlatformUsersResponse = {
  data: PlatformUser[];
};

export type PlatformWorkshopDetailResponse = {
  data: {
    workshop: PlatformWorkshop;
    users: PlatformUser[];
    invitations: PlatformInvitation[];
    auditLogs: PlatformAuditLog[];
  };
};

export type UpdatePlatformUserAccessResponse = {
  data: PlatformUser;
};

export type UpdatePlatformUserRoleInput = {
  role: AuthRole;
};

export type UpdatePlatformUserRoleResponse = {
  data: PlatformUser;
};

export type PlatformSummaryResponse = {
  workshops: {
    total: number;
    active: number;
    disabled: number;
    archived: number;
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

export type UpdatePlatformWorkshopStatusResponse = {
  data: PlatformWorkshop;
};

export type CreatePlatformInvitationInput = {
  email: string;
  role: AuthRole;
};

export type CreatePlatformInvitationResponse = {
  data: PlatformInvitation;
  delivery?: {
    sent: boolean;
    providerMessageId: string | null;
    reason: string | null;
  };
  setupToken: string;
  setupUrl: string;
};

export type RevokePlatformInvitationResponse = {
  data: PlatformInvitation;
};

export type ArchivePlatformInvitationResponse = {
  data: PlatformInvitation;
};

export type ResendPlatformInvitationResponse = {
  data: PlatformInvitation;
  delivery?: {
    sent: boolean;
    providerMessageId: string | null;
    reason: string | null;
  };
  setupToken: string;
  setupUrl: string;
};

export type PlatformInvitationAcceptanceResponse = {
  data: {
    email: string;
    role: AuthRole;
    expiresAt: string;
    workshop: {
      id: string;
      name: string;
      slug: string;
    };
  };
};

export type AcceptPlatformInvitationInput = {
  token: string;
  name: string;
  password: string;
};

export type AcceptPlatformInvitationResponse = {
  user: {
    id: string;
    email: string;
    name: string;
  };
  workshop: {
    id: string;
    name: string;
    slug: string;
  };
};
