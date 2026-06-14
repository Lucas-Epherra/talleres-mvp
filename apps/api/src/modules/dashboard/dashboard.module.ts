import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

/**
 * Dashboard feature module.
 *
 * Imports AuthModule because dashboard routes are protected with AuthGuard and
 * scoped by the authenticated user's workshopId.
 */
@Module({
  imports: [AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
