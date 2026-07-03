import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { DashboardService } from './dashboard.service';

/**
 * HTTP controller for dashboard operations.
 *
 * All routes are authenticated and scoped by the authenticated user's workshop.
 */
@UseGuards(AuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Returns the complete operational dashboard for the authenticated workshop.
   */
  @Get()
  getDashboard(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getSummary(user.workshopId);
  }

  /**
   * Returns the operational dashboard summary for the authenticated user's workshop.
   *
   * Kept for backwards compatibility with the current frontend endpoint.
   */
  @Get('summary')
  getSummary(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getSummary(user.workshopId);
  }
}
