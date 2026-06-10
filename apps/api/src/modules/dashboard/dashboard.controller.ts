import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

/**
 * HTTP controller for dashboard operations.
 */
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Returns the operational dashboard summary for the current workshop.
   */
  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }
}