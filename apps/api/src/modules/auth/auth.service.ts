import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  MembershipStatus,
  PlatformRole,
  UserStatus,
  WorkshopRole,
  WorkshopStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthUser } from './types/auth-user.type';
import { JwtPayload } from './types/jwt-payload.type';

const INVALID_CREDENTIALS_MESSAGE = 'Credenciales inválidas.';

/**
 * Handles authentication, token generation and current-user resolution.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validates credentials and returns the authenticated user context plus token.
   */
  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        memberships: {
          where: {
            status: MembershipStatus.ACTIVE,
            workshop: {
              status: WorkshopStatus.ACTIVE,
            },
          },
          include: {
            workshop: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const membership = user.memberships[0];

    if (!membership) {
      throw new UnauthorizedException(
        'El usuario no pertenece a ningún taller activo.',
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      workshopId: membership.workshopId,
      role: membership.role,
      platformRole: user.platformRole,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        platformRole: user.platformRole,
        status: user.status,
        workshopId: membership.workshopId,
        workshopRole: membership.role,
        role: membership.role,
      } satisfies AuthUser,
      workshop: membership.workshop,
    };
  }

  /**
   * Resolves the authenticated user from a verified JWT payload.
   */
  async getCurrentUser(payload: JwtPayload): Promise<AuthUser> {
    const safePayload = this.validateJwtPayload(payload);

    const membership = await this.prisma.workshopMember.findFirst({
      where: {
        userId: safePayload.sub,
        workshopId: safePayload.workshopId,
        status: MembershipStatus.ACTIVE,
        workshop: {
          status: WorkshopStatus.ACTIVE,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            platformRole: true,
            status: true,
          },
        },
      },
    });

    if (!membership || membership.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Contexto de autenticación inválido.');
    }

    return {
      id: membership.user.id,
      email: membership.user.email,
      name: membership.user.name,
      platformRole: membership.user.platformRole,
      status: membership.user.status,
      workshopId: membership.workshopId,
      workshopRole: membership.role,
      role: membership.role,
    };
  }

  /**
   * Verifies an access token and returns its safe payload.
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      return this.validateJwtPayload(payload);
    } catch {
      throw new UnauthorizedException('Token inválido o expirado.');
    }
  }

  /**
   * Normalizes emails before querying the database.
   */
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Validates the minimum runtime shape expected from the access token payload.
   */
  private validateJwtPayload(payload: JwtPayload): JwtPayload {
    const isValidWorkshopRole = Object.values(WorkshopRole).includes(
      payload.role,
    );
    const isValidPlatformRole = Object.values(PlatformRole).includes(
      payload.platformRole,
    );

    if (
      typeof payload.sub !== 'string' ||
      !payload.sub ||
      typeof payload.workshopId !== 'string' ||
      !payload.workshopId ||
      !isValidWorkshopRole ||
      !isValidPlatformRole
    ) {
      throw new UnauthorizedException('Contexto de autenticación inválido.');
    }

    return payload;
  }
}
