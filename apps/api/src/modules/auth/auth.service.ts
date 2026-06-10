import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthUser } from './types/auth-user.type';
import { JwtPayload } from './types/jwt-payload.type';

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
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
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
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const membership = user.memberships[0];

    if (!membership) {
      throw new UnauthorizedException('User does not belong to a workshop.');
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
    const membership = await this.prisma.workshopMember.findFirst({
      where: {
        userId: payload.sub,
        workshopId: payload.workshopId,
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
      throw new UnauthorizedException('Invalid authentication context.');
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
   * Verifies an access token and returns its payload.
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}