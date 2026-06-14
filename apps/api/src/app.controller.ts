import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Root application controller.
 *
 * Only exposes a minimal health-check endpoint. Domain data lives behind
 * authenticated feature modules.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Public health check used to verify that the API process is alive.
   */
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
