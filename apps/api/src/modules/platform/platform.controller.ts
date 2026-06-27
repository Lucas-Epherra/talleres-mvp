import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreatePlatformInvitationDto } from './dto/create-platform-invitation.dto';
import { CreatePlatformWorkshopDto } from './dto/create-platform-workshop.dto';
import { UpdatePlatformUserRoleDto } from './dto/update-platform-user-role.dto';
import { PlatformOwnerGuard } from './guards/platform-owner.guard';
import { PlatformService } from './platform.service';

/**
 * Platform administration endpoints.
 *
 * These endpoints are reserved for Mi Taller 360 internal administrators and
 * must never be exposed to regular workshop users.
 */
@Controller('platform')
@UseGuards(AuthGuard, PlatformOwnerGuard)
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  /**
   * Returns the current platform owner context.
   */
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        platformRole: user.platformRole,
        status: user.status,
      },
      capabilities: getPlatformCapabilities(),
    };
  }

  /**
   * Returns platform dashboard metrics.
   */
  @Get('summary')
  summary() {
    return this.platformService.getSummary();
  }

  /**
   * Returns customer workshops.
   */
  @Get('workshops')
  workshops() {
    return this.platformService.listWorkshops();
  }

  /**
   * Returns pending and historical invitations.
   */
  @Get('invitations')
  invitations() {
    return this.platformService.listInvitations();
  }

  /**
   * Returns workshop users across the platform.
   */
  @Get('users')
  users() {
    return this.platformService.listUsers();
  }

  /**
   * Creates a customer workshop.
   */
  @Post('workshops')
  @HttpCode(HttpStatus.CREATED)
  createWorkshop(@Body() dto: CreatePlatformWorkshopDto) {
    return this.platformService.createWorkshop(dto);
  }

  /**
   * Suspends a customer workshop.
   */
  @Post('workshops/:workshopId/disable')
  @HttpCode(HttpStatus.OK)
  disableWorkshop(
    @Param('workshopId', new ParseUUIDPipe()) workshopId: string,
  ) {
    return this.platformService.disableWorkshop(workshopId);
  }

  /**
   * Reactivates a suspended customer workshop.
   */
  @Post('workshops/:workshopId/enable')
  @HttpCode(HttpStatus.OK)
  enableWorkshop(@Param('workshopId', new ParseUUIDPipe()) workshopId: string) {
    return this.platformService.enableWorkshop(workshopId);
  }

  /**
   * Creates an invitation for a workshop user.
   */
  @Post('workshops/:workshopId/invitations')
  @HttpCode(HttpStatus.CREATED)
  createInvitation(
    @Param('workshopId', new ParseUUIDPipe()) workshopId: string,
    @Body() dto: CreatePlatformInvitationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.platformService.createInvitation(workshopId, dto, user.id);
  }

  /**
   * Revokes a pending platform invitation.
   */
  @Post('invitations/:invitationId/revoke')
  @HttpCode(HttpStatus.OK)
  revokeInvitation(
    @Param('invitationId', new ParseUUIDPipe()) invitationId: string,
  ) {
    return this.platformService.revokeInvitation(invitationId);
  }

  /**
   * Resends a platform invitation with a fresh token.
   */
  @Post('invitations/:invitationId/resend')
  @HttpCode(HttpStatus.OK)
  resendInvitation(
    @Param('invitationId', new ParseUUIDPipe()) invitationId: string,
  ) {
    return this.platformService.resendInvitation(invitationId);
  }

  /**
   * Archives a revoked or expired platform invitation.
   */
  @Post('invitations/:invitationId/archive')
  @HttpCode(HttpStatus.OK)
  archiveInvitation(
    @Param('invitationId', new ParseUUIDPipe()) invitationId: string,
  ) {
    return this.platformService.archiveInvitation(invitationId);
  }

  /**
   * Disables a workshop user access.
   */
  @Post('users/:membershipId/disable')
  @HttpCode(HttpStatus.OK)
  disableUserAccess(
    @Param('membershipId', new ParseUUIDPipe()) membershipId: string,
  ) {
    return this.platformService.disableUserAccess(membershipId);
  }

  /**
   * Reactivates a workshop user access.
   */
  @Post('users/:membershipId/enable')
  @HttpCode(HttpStatus.OK)
  enableUserAccess(
    @Param('membershipId', new ParseUUIDPipe()) membershipId: string,
  ) {
    return this.platformService.enableUserAccess(membershipId);
  }

  /**
   * Updates a workshop user role.
   */
  @Patch('users/:membershipId/role')
  @HttpCode(HttpStatus.OK)
  updateUserRole(
    @Param('membershipId', new ParseUUIDPipe()) membershipId: string,
    @Body() dto: UpdatePlatformUserRoleDto,
  ) {
    return this.platformService.updateUserRole(membershipId, dto.role);
  }
}

/**
 * Centralizes platform capability labels exposed to the frontend.
 */
function getPlatformCapabilities(): string[] {
  return [
    'PLATFORM_READ',
    'WORKSHOPS_READ',
    'WORKSHOPS_CREATE',
    'WORKSHOPS_DISABLE',
    'WORKSHOPS_ENABLE',
    'USERS_READ',
    'INVITATIONS_READ',
    'INVITATIONS_CREATE',
    'INVITATIONS_REVOKE',
    'INVITATIONS_RESEND',
    'INVITATIONS_ARCHIVE',
    'USERS_DISABLE',
    'USERS_ENABLE',
    'USERS_UPDATE_ROLE',
  ];
}
