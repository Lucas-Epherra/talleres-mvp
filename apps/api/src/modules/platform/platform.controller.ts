import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreatePlatformInvitationDto } from './dto/create-platform-invitation.dto';
import { CreatePlatformWorkshopDto } from './dto/create-platform-workshop.dto';
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
  
}



/**
 * Centralizes platform capability labels exposed to the frontend.
 */
function getPlatformCapabilities(): string[] {
  return [
    'PLATFORM_READ',
    'WORKSHOPS_READ',
    'WORKSHOPS_CREATE',
    'USERS_READ',
    'INVITATIONS_READ',
    'INVITATIONS_CREATE',
    'INVITATIONS_REVOKE',
    'INVITATIONS_RESEND',
    'USERS_DISABLE',
    'USERS_ENABLE',
  ];
}
