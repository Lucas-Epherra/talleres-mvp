import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { UpdateWorkshopSettingsDto } from './dto/update-workshop-settings.dto';
import { WorkshopSettingsService } from './workshop-settings.service';

/**
 * HTTP controller for authenticated workshop settings.
 *
 * These endpoints are tenant-scoped by the authenticated user's workshopId.
 */
@Controller('workshop/settings')
@UseGuards(AuthGuard)
export class WorkshopSettingsController {
  constructor(
    private readonly workshopSettingsService: WorkshopSettingsService,
  ) {}

  /**
   * Returns settings for the authenticated workshop.
   */
  @Get()
  getSettings(@CurrentUser() user: AuthUser) {
    return this.workshopSettingsService.getSettings(user.workshopId);
  }

  /**
   * Updates settings for the authenticated workshop.
   */
  @Patch()
  updateSettings(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateWorkshopSettingsDto,
  ) {
    return this.workshopSettingsService.updateSettings(user.workshopId, dto);
  }
}