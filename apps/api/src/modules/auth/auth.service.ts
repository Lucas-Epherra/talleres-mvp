import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WorkshopRole } from '@prisma/client';
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
          include: {
            workshop: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const membership = user.memberships[0];

    if (!membership) {
      throw new UnauthorizedException(
        'El usuario no pertenece a ningún taller.',
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      workshopId: membership.workshopId,
      role: membership.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        workshopId: membership.workshopId,
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
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!membership) {
      throw new UnauthorizedException('Contexto de autenticación inválido.');
    }

    return {
      id: membership.user.id,
      email: membership.user.email,
      name: membership.user.name,
      workshopId: membership.workshopId,
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
    const isValidRole = Object.values(WorkshopRole).includes(
      payload.role as WorkshopRole,
    );

    if (
      typeof payload.sub !== 'string' ||
      !payload.sub ||
      typeof payload.workshopId !== 'string' ||
      !payload.workshopId ||
      !isValidRole
    ) {
      throw new UnauthorizedException('Contexto de autenticación inválido.');
    }

    return payload;
  }
}