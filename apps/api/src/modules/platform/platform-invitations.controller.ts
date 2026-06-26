import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { AcceptPlatformInvitationDto } from './dto/accept-platform-invitation.dto';
import { InvitationTokenDto } from './dto/invitation-token.dto';
import { PlatformService } from './platform.service';

/**
 * Public invitation endpoints.
 *
 * These endpoints are intentionally unauthenticated because invited users do not
 * have an account yet. Security relies on the one-time invitation token, which
 * is stored only as a hash in the database.
 */
@Controller('invitations')
export class PlatformInvitationsController {
  constructor(private readonly platformService: PlatformService) {}

  /**
   * Returns invitation data required to render the acceptance screen.
   */
  @Get('acceptance')
  getAcceptance(@Query() dto: InvitationTokenDto) {
    return this.platformService.getInvitationAcceptance(dto.token);
  }

  /**
   * Accepts an invitation and creates access to the invited workshop.
   */
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  accept(@Body() dto: AcceptPlatformInvitationDto) {
    return this.platformService.acceptInvitation(dto);
  }
}