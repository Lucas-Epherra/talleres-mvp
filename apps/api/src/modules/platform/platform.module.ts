import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlatformOwnerGuard } from './guards/platform-owner.guard';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

/**
 * Platform administration module.
 *
 * Handles SaaS-level administration such as platform owner checks, future
 * workshop creation, invitations and account control.
 */
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [PlatformController],
  providers: [PlatformOwnerGuard, PlatformService],
})
export class PlatformModule {}
