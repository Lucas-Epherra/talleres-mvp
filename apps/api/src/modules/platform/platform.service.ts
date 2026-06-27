import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvitationStatus,
  MembershipStatus,
  PlatformRole,
  Prisma,
  UserStatus,
  WorkshopRole,
  WorkshopStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AcceptPlatformInvitationDto } from './dto/accept-platform-invitation.dto';
import { CreatePlatformInvitationDto } from './dto/create-platform-invitation.dto';
import { CreatePlatformWorkshopDto } from './dto/create-platform-workshop.dto';
import { PlatformMailService } from './platform-mail.service';

const PLATFORM_INTERNAL_WORKSHOP_SLUG = 'mi-taller-360-platform';
const MAX_GENERATED_SLUG_ATTEMPTS = 20;
const INVITATION_EXPIRATION_DAYS = 7;

/**
 * Handles platform-level operations for internal Mi Taller 360 administration.
 *
 * The internal platform workshop is excluded from customer metrics because it
 * only exists to keep the current workshop-first authentication flow compatible
 * while platform administration evolves.
 */
@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformMailService: PlatformMailService,
  ) {}
  /**
   * Returns platform dashboard summary metrics.
   */
  async getSummary() {
    const [
      totalWorkshops,
      activeWorkshops,
      disabledWorkshops,
      activeUsers,
      platformOwners,
      activeWorkshopMembers,
      pendingInvitations,
    ] = await Promise.all([
      this.prisma.workshop.count({
        where: {
          slug: {
            not: PLATFORM_INTERNAL_WORKSHOP_SLUG,
          },
        },
      }),
      this.prisma.workshop.count({
        where: {
          slug: {
            not: PLATFORM_INTERNAL_WORKSHOP_SLUG,
          },
          status: WorkshopStatus.ACTIVE,
        },
      }),
      this.prisma.workshop.count({
        where: {
          slug: {
            not: PLATFORM_INTERNAL_WORKSHOP_SLUG,
          },
          status: WorkshopStatus.DISABLED,
        },
      }),
      this.prisma.user.count({
        where: {
          status: UserStatus.ACTIVE,
        },
      }),
      this.prisma.user.count({
        where: {
          platformRole: PlatformRole.OWNER,
          status: UserStatus.ACTIVE,
        },
      }),
      this.prisma.workshopMember.count({
        where: {
          status: MembershipStatus.ACTIVE,
          workshop: {
            slug: {
              not: PLATFORM_INTERNAL_WORKSHOP_SLUG,
            },
          },
        },
      }),
      this.prisma.invitation.count({
        where: {
          status: InvitationStatus.PENDING,
          expiresAt: {
            gt: new Date(),
          },
          workshop: {
            slug: {
              not: PLATFORM_INTERNAL_WORKSHOP_SLUG,
            },
          },
        },
      }),
    ]);

    return {
      workshops: {
        total: totalWorkshops,
        active: activeWorkshops,
        disabled: disabledWorkshops,
      },
      users: {
        active: activeUsers,
        platformOwners,
        activeWorkshopMembers,
      },
      invitations: {
        pending: pendingInvitations,
      },
    };
  }

  /**
   * Lists customer workshops registered in the platform.
   */
  async listWorkshops() {
    const workshops = await this.prisma.workshop.findMany({
      where: {
        slug: {
          not: PLATFORM_INTERNAL_WORKSHOP_SLUG,
        },
      },
      select: getWorkshopListSelect(),
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return {
      data: workshops.map(serializePlatformWorkshop),
    };
  }

  /**
   * Lists platform invitations.
   */
  async listInvitations() {
    const invitations = await this.prisma.invitation.findMany({
      where: {
        workshop: {
          slug: {
            not: PLATFORM_INTERNAL_WORKSHOP_SLUG,
          },
        },
      },
      select: getInvitationListSelect(),
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return {
      data: invitations.map(serializePlatformInvitation),
    };
  }

  /**
   * Lists workshop users across customer workshops.
   */
  async listUsers() {
    const memberships = await this.prisma.workshopMember.findMany({
      where: {
        workshop: {
          slug: {
            not: PLATFORM_INTERNAL_WORKSHOP_SLUG,
          },
        },
      },
      select: getPlatformUserListSelect(),
      orderBy: [
        {
          workshop: {
            name: 'asc',
          },
        },
        {
          createdAt: 'desc',
        },
      ],
      take: 100,
    });

    return {
      data: memberships.map(serializePlatformUser),
    };
  }

  /**
   * Disables a workshop user access without deleting the user account.
   */
  async disableUserAccess(membershipId: string) {
    const membership = await this.prisma.workshopMember.findFirst({
      where: {
        id: membershipId,
        workshop: {
          slug: {
            not: PLATFORM_INTERNAL_WORKSHOP_SLUG,
          },
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('No se encontró el acceso del usuario.');
    }

    if (membership.status === MembershipStatus.DISABLED) {
      throw new ConflictException('Este acceso ya está deshabilitado.');
    }

    const updatedMembership = await this.prisma.workshopMember.update({
      where: {
        id: membership.id,
      },
      data: {
        status: MembershipStatus.DISABLED,
      },
      select: getPlatformUserListSelect(),
    });

    return {
      data: serializePlatformUser(updatedMembership),
    };
  }

  /**
   * Reactivates a disabled workshop user access.
   */
  async enableUserAccess(membershipId: string) {
    const membership = await this.prisma.workshopMember.findFirst({
      where: {
        id: membershipId,
        workshop: {
          slug: {
            not: PLATFORM_INTERNAL_WORKSHOP_SLUG,
          },
        },
      },
      select: {
        id: true,
        status: true,
        user: {
          select: {
            status: true,
          },
        },
        workshop: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('No se encontró el acceso del usuario.');
    }

    if (membership.status === MembershipStatus.ACTIVE) {
      throw new ConflictException('Este acceso ya está activo.');
    }

    if (membership.user.status !== UserStatus.ACTIVE) {
      throw new ConflictException(
        'No se puede reactivar el acceso porque el usuario está deshabilitado.',
      );
    }

    if (membership.workshop.status !== WorkshopStatus.ACTIVE) {
      throw new ConflictException(
        'No se puede reactivar el acceso porque el taller está suspendido.',
      );
    }

    const updatedMembership = await this.prisma.workshopMember.update({
      where: {
        id: membership.id,
      },
      data: {
        status: MembershipStatus.ACTIVE,
      },
      select: getPlatformUserListSelect(),
    });

    return {
      data: serializePlatformUser(updatedMembership),
    };
  }

  /**
   * Updates a workshop user role without changing access status.
   */
  async updateUserRole(membershipId: string, role: WorkshopRole) {
    const membership = await this.prisma.workshopMember.findFirst({
      where: {
        id: membershipId,
        workshop: {
          slug: {
            not: PLATFORM_INTERNAL_WORKSHOP_SLUG,
          },
        },
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('No se encontró el acceso del usuario.');
    }

    if (membership.role === role) {
      throw new ConflictException('Ese usuario ya tiene ese rol.');
    }

    const updatedMembership = await this.prisma.workshopMember.update({
      where: {
        id: membership.id,
      },
      data: {
        role,
      },
      select: getPlatformUserListSelect(),
    });

    return {
      data: serializePlatformUser(updatedMembership),
    };
  }

  /**
   * Creates a new customer workshop account.
   *
   * This does not create users or invitations yet. Access provisioning is
   * intentionally handled as a separate step so tenant creation and user access
   * stay auditable.
   */
  async createWorkshop(dto: CreatePlatformWorkshopDto) {
    const name = dto.name.trim();
    const requestedSlug = dto.slug?.trim().toLowerCase();
    const slug = requestedSlug ?? (await this.generateAvailableSlug(name));

    if (slug === PLATFORM_INTERNAL_WORKSHOP_SLUG) {
      throw new BadRequestException(
        'Ese código interno está reservado por la plataforma.',
      );
    }

    await this.ensureWorkshopNameIsAvailable(name);

    try {
      const workshop = await this.prisma.workshop.create({
        data: {
          name,
          slug,
          status: WorkshopStatus.ACTIVE,
        },
        select: getWorkshopListSelect(),
      });

      return {
        data: serializePlatformWorkshop(workshop),
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Ya existe un taller con ese código interno.',
        );
      }

      throw error;
    }
  }

  /**
   * Suspends a customer workshop without deleting its data.
   */
  async disableWorkshop(workshopId: string) {
    const workshop = await this.prisma.workshop.findFirst({
      where: {
        id: workshopId,
        slug: {
          not: PLATFORM_INTERNAL_WORKSHOP_SLUG,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!workshop) {
      throw new NotFoundException('No se encontró el taller.');
    }

    if (workshop.status === WorkshopStatus.DISABLED) {
      throw new ConflictException('Este taller ya está suspendido.');
    }

    const updatedWorkshop = await this.prisma.workshop.update({
      where: {
        id: workshop.id,
      },
      data: {
        status: WorkshopStatus.DISABLED,
      },
      select: getWorkshopListSelect(),
    });

    return {
      data: serializePlatformWorkshop(updatedWorkshop),
    };
  }

  /**
   * Reactivates a suspended customer workshop.
   */
  async enableWorkshop(workshopId: string) {
    const workshop = await this.prisma.workshop.findFirst({
      where: {
        id: workshopId,
        slug: {
          not: PLATFORM_INTERNAL_WORKSHOP_SLUG,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!workshop) {
      throw new NotFoundException('No se encontró el taller.');
    }

    if (workshop.status === WorkshopStatus.ACTIVE) {
      throw new ConflictException('Este taller ya está activo.');
    }

    const updatedWorkshop = await this.prisma.workshop.update({
      where: {
        id: workshop.id,
      },
      data: {
        status: WorkshopStatus.ACTIVE,
      },
      select: getWorkshopListSelect(),
    });

    return {
      data: serializePlatformWorkshop(updatedWorkshop),
    };
  }

  /**
   * Creates a pending invitation for a workshop user.
   *
   * The raw token is returned once so the internal administrator can use it
   * during local QA. Later, this token should be delivered by email instead of
   * being exposed manually.
   */
  async createInvitation(
    workshopId: string,
    dto: CreatePlatformInvitationDto,
    createdByUserId: string,
  ) {
    const email = dto.email.trim().toLowerCase();
    const role = dto.role ?? WorkshopRole.ADMIN;

    const workshop = await this.prisma.workshop.findFirst({
      where: {
        id: workshopId,
        slug: {
          not: PLATFORM_INTERNAL_WORKSHOP_SLUG,
        },
        status: WorkshopStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!workshop) {
      throw new NotFoundException('No se encontró un taller activo.');
    }

    await this.ensureUserIsNotAlreadyMember(workshopId, email);
    await this.ensurePendingInvitationDoesNotExist(workshopId, email);

    const rawToken = createInvitationToken();
    const tokenHash = hashInvitationToken(rawToken);
    const expiresAt = getInvitationExpirationDate();
    const invitationUrl = buildInvitationUrl(rawToken);

    const invitation = await this.prisma.invitation.create({
      data: {
        workshopId,
        email,
        role,
        tokenHash,
        expiresAt,
        createdByUserId,
        status: InvitationStatus.PENDING,
      },
      select: getInvitationListSelect(),
    });

    const delivery = await this.platformMailService.sendWorkshopInvitationEmail(
      {
        to: email,
        workshopName: workshop.name,
        invitationUrl,
        expiresAt,
      },
    );

    return {
      data: serializePlatformInvitation(invitation),
      delivery,
      setupToken: rawToken,
      setupUrl: invitationUrl,
    };
  }

  /**
   * Revokes a pending invitation so its acceptance link stops working.
   */
  async revokeInvitation(invitationId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        id: invitationId,
        workshop: {
          slug: {
            not: PLATFORM_INTERNAL_WORKSHOP_SLUG,
          },
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('No se encontró la invitación.');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ConflictException(
        'Solo se pueden revocar invitaciones pendientes.',
      );
    }

    const revokedInvitation = await this.prisma.invitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: InvitationStatus.REVOKED,
        revokedAt: new Date(),
      },
      select: getInvitationListSelect(),
    });

    return {
      data: serializePlatformInvitation(revokedInvitation),
    };
  }

  /**
   * Resends a pending or expired invitation with a fresh token.
   *
   * The previous invitation link stops working because the stored token hash is
   * replaced with the new one.
   */
  async resendInvitation(invitationId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        id: invitationId,
        workshop: {
          slug: {
            not: PLATFORM_INTERNAL_WORKSHOP_SLUG,
          },
        },
      },
      select: {
        id: true,
        email: true,
        status: true,
        workshop: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('No se encontró la invitación.');
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new ConflictException(
        'Esta invitación ya fue aceptada. No se puede reenviar.',
      );
    }

    if (invitation.status === InvitationStatus.REVOKED) {
      throw new ConflictException(
        'Esta invitación fue revocada. Creá una invitación nueva.',
      );
    }

    if (invitation.workshop.status !== WorkshopStatus.ACTIVE) {
      throw new ConflictException('El taller no está activo.');
    }

    const rawToken = createInvitationToken();
    const tokenHash = hashInvitationToken(rawToken);
    const expiresAt = getInvitationExpirationDate();
    const invitationUrl = buildInvitationUrl(rawToken);

    const updatedInvitation = await this.prisma.invitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: InvitationStatus.PENDING,
        tokenHash,
        expiresAt,
        revokedAt: null,
      },
      select: getInvitationListSelect(),
    });

    const delivery = await this.platformMailService.sendWorkshopInvitationEmail(
      {
        to: invitation.email,
        workshopName: invitation.workshop.name,
        invitationUrl,
        expiresAt,
      },
    );

    return {
      data: serializePlatformInvitation(updatedInvitation),
      delivery,
      setupToken: rawToken,
      setupUrl: invitationUrl,
    };
  }

  /**
   * Returns safe invitation data before the invited user creates access.
   */
  async getInvitationAcceptance(token: string) {
    const invitation = await this.getValidPendingInvitation(token);

    return {
      data: {
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString(),
        workshop: {
          id: invitation.workshop.id,
          name: invitation.workshop.name,
          slug: invitation.workshop.slug,
        },
      },
    };
  }

  /**
   * Accepts an invitation by creating a user and activating workshop access.
   */
  async acceptInvitation(dto: AcceptPlatformInvitationDto) {
    const invitation = await this.getValidPendingInvitation(dto.token);
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const acceptedAt = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const currentInvitation = await tx.invitation.findUnique({
        where: {
          id: invitation.id,
        },
        select: {
          id: true,
          status: true,
          email: true,
          role: true,
          workshopId: true,
          expiresAt: true,
        },
      });

      if (!currentInvitation) {
        throw new NotFoundException(
          'La invitación no existe o ya no está disponible.',
        );
      }

      if (currentInvitation.status !== InvitationStatus.PENDING) {
        throw new ConflictException('Esta invitación ya no está disponible.');
      }

      if (currentInvitation.expiresAt <= new Date()) {
        await tx.invitation.update({
          where: {
            id: currentInvitation.id,
          },
          data: {
            status: InvitationStatus.EXPIRED,
          },
        });

        throw new BadRequestException(
          'La invitación venció. Pedí un nuevo acceso.',
        );
      }

      const existingUser = await tx.user.findUnique({
        where: {
          email: invitation.email,
        },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
        },
      });

      if (existingUser?.status === UserStatus.DISABLED) {
        throw new ConflictException(
          'Ese email pertenece a una cuenta deshabilitada.',
        );
      }

      const user =
        existingUser ??
        (await tx.user.create({
          data: {
            name: dto.name.trim(),
            email: invitation.email,
            passwordHash,
            platformRole: PlatformRole.NONE,
            status: UserStatus.ACTIVE,
          },
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
          },
        }));

      await tx.workshopMember.upsert({
        where: {
          workshopId_userId: {
            workshopId: invitation.workshopId,
            userId: user.id,
          },
        },
        update: {
          role: invitation.role,
          status: MembershipStatus.ACTIVE,
        },
        create: {
          workshopId: invitation.workshopId,
          userId: user.id,
          role: invitation.role,
          status: MembershipStatus.ACTIVE,
        },
      });

      await tx.invitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt,
          acceptedByUserId: user.id,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    });

    return {
      user: result.user,
      workshop: {
        id: invitation.workshop.id,
        name: invitation.workshop.name,
        slug: invitation.workshop.slug,
      },
    };
  }

  /**
   * Prevents creating visually duplicated workshop accounts by name.
   */
  private async ensureWorkshopNameIsAvailable(name: string): Promise<void> {
    const existingWorkshop = await this.prisma.workshop.findFirst({
      where: {
        slug: {
          not: PLATFORM_INTERNAL_WORKSHOP_SLUG,
        },
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
      },
    });

    if (existingWorkshop) {
      throw new ConflictException('Ya existe un taller con ese nombre.');
    }
  }

  /**
   * Prevents inviting an email that already belongs to the same workshop.
   */
  private async ensureUserIsNotAlreadyMember(
    workshopId: string,
    email: string,
  ): Promise<void> {
    const existingMember = await this.prisma.workshopMember.findFirst({
      where: {
        workshopId,
        status: MembershipStatus.ACTIVE,
        user: {
          email,
          status: UserStatus.ACTIVE,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingMember) {
      throw new ConflictException(
        'Ese usuario ya tiene acceso activo a este taller.',
      );
    }
  }

  /**
   * Prevents multiple active pending invitations for the same workshop/email.
   */
  private async ensurePendingInvitationDoesNotExist(
    workshopId: string,
    email: string,
  ): Promise<void> {
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        workshopId,
        email,
        status: InvitationStatus.PENDING,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    if (existingInvitation) {
      throw new ConflictException(
        'Ya existe una invitación pendiente para ese email.',
      );
    }
  }

  /**
   * Generates an available URL-safe internal code from a workshop name.
   */
  private async generateAvailableSlug(name: string): Promise<string> {
    const baseSlug = slugifyWorkshopName(name);

    if (!baseSlug) {
      throw new BadRequestException(
        'El nombre del taller no permite generar un código interno válido.',
      );
    }

    for (let attempt = 0; attempt < MAX_GENERATED_SLUG_ATTEMPTS; attempt += 1) {
      const candidateSlug =
        attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

      const existingWorkshop = await this.prisma.workshop.findUnique({
        where: {
          slug: candidateSlug,
        },
        select: {
          id: true,
        },
      });

      if (!existingWorkshop) {
        return candidateSlug;
      }
    }

    throw new ConflictException(
      'No se pudo generar un código interno disponible para este taller.',
    );
  }

  /**
   * Reads and validates a pending invitation by raw token.
   */
  private async getValidPendingInvitation(token: string) {
    const tokenHash = hashInvitationToken(token);

    const invitation = await this.prisma.invitation.findUnique({
      where: {
        tokenHash,
      },
      select: getInvitationAcceptanceSelect(),
    });

    if (!invitation) {
      throw new NotFoundException(
        'La invitación no existe o ya no está disponible.',
      );
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ConflictException(
        'Esta invitación ya fue utilizada o cancelada.',
      );
    }

    if (invitation.expiresAt <= new Date()) {
      await this.prisma.invitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: InvitationStatus.EXPIRED,
        },
      });

      throw new BadRequestException(
        'La invitación venció. Pedí un nuevo acceso.',
      );
    }

    if (invitation.workshop.status !== WorkshopStatus.ACTIVE) {
      throw new ConflictException('El taller no está activo.');
    }

    return invitation;
  }
}

/**
 * Shared select for platform workshop list responses.
 */
function getWorkshopListSelect() {
  return {
    id: true,
    name: true,
    slug: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    _count: {
      select: {
        members: true,
        customers: true,
        vehicles: true,
        workOrders: true,
        appointments: true,
      },
    },
  } satisfies Prisma.WorkshopSelect;
}

/**
 * Shared select for platform invitation list responses.
 */
function getInvitationListSelect() {
  return {
    id: true,
    email: true,
    role: true,
    status: true,
    expiresAt: true,
    acceptedAt: true,
    revokedAt: true,
    createdAt: true,
    updatedAt: true,
    workshop: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
    createdByUser: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  } satisfies Prisma.InvitationSelect;
}

/**
 * Shared select for invitation acceptance.
 */
function getInvitationAcceptanceSelect() {
  return {
    id: true,
    email: true,
    role: true,
    status: true,
    tokenHash: true,
    expiresAt: true,
    workshopId: true,
    workshop: {
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      },
    },
  } satisfies Prisma.InvitationSelect;
}

/**
 * Shared select for platform user list responses.
 */
function getPlatformUserListSelect() {
  return {
    id: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    },
    workshop: {
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      },
    },
  } satisfies Prisma.WorkshopMemberSelect;
}

type PlatformWorkshopRecord = Prisma.WorkshopGetPayload<{
  select: ReturnType<typeof getWorkshopListSelect>;
}>;

type PlatformInvitationRecord = Prisma.InvitationGetPayload<{
  select: ReturnType<typeof getInvitationListSelect>;
}>;

type PlatformUserRecord = Prisma.WorkshopMemberGetPayload<{
  select: ReturnType<typeof getPlatformUserListSelect>;
}>;

/**
 * Serializes a workshop record for platform frontend usage.
 */
function serializePlatformWorkshop(workshop: PlatformWorkshopRecord) {
  return {
    id: workshop.id,
    name: workshop.name,
    slug: workshop.slug,
    status: workshop.status,
    createdAt: workshop.createdAt.toISOString(),
    updatedAt: workshop.updatedAt.toISOString(),
    counts: {
      members: workshop._count.members,
      customers: workshop._count.customers,
      vehicles: workshop._count.vehicles,
      workOrders: workshop._count.workOrders,
      appointments: workshop._count.appointments,
    },
  };
}

/**
 * Serializes an invitation record for platform frontend usage.
 */
function serializePlatformInvitation(invitation: PlatformInvitationRecord) {
  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    expiresAt: invitation.expiresAt.toISOString(),
    acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
    revokedAt: invitation.revokedAt?.toISOString() ?? null,
    createdAt: invitation.createdAt.toISOString(),
    updatedAt: invitation.updatedAt.toISOString(),
    workshop: invitation.workshop,
    createdByUser: invitation.createdByUser,
  };
}

/**
 * Serializes a workshop membership record for platform frontend usage.
 */
function serializePlatformUser(membership: PlatformUserRecord) {
  return {
    membershipId: membership.id,
    role: membership.role,
    status: membership.status,
    createdAt: membership.createdAt.toISOString(),
    updatedAt: membership.updatedAt.toISOString(),
    user: {
      id: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
      status: membership.user.status,
      createdAt: membership.user.createdAt.toISOString(),
      updatedAt: membership.user.updatedAt.toISOString(),
    },
    workshop: membership.workshop,
  };
}

/**
 * Converts a workshop name into a URL-safe internal code.
 */
function slugifyWorkshopName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80);
}

/**
 * Creates a cryptographically strong invitation token.
 */
function createInvitationToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Hashes an invitation token before database persistence or lookup.
 */
function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Returns the expiration date for a new invitation.
 */
function getInvitationExpirationDate(): Date {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + INVITATION_EXPIRATION_DAYS);

  return expirationDate;
}

/**
 * Checks whether Prisma rejected a unique constraint.
 */
function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

/**
 * Builds the public invitation acceptance URL.
 */
function buildInvitationUrl(token: string): string {
  const appPublicUrl =
    process.env.APP_PUBLIC_URL?.trim() || 'http://localhost:3000';

  return `${appPublicUrl.replace(/\/+$/g, '')}/aceptar-invitacion?token=${encodeURIComponent(
    token,
  )}`;
}
