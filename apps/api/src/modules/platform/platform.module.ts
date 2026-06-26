import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PlatformOwnerGuard } from './guards/platform-owner.guard';
import { PlatformController } from './platform.controller';
import { PlatformInvitationsController } from './platform-invitations.controller';
import { PlatformService } from './platform.service';

/**
 * Platform administration module.
 *
 * Handles internal platform administration and public invitation acceptance.
 */
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [PlatformController, PlatformInvitationsController],
  providers: [PlatformOwnerGuard, PlatformService],
})
export class PlatformModule {}