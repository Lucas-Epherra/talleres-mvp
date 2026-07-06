import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkshopLogoStorageService } from './workshop-logo-storage.service';
import { WorkshopSettingsController } from './workshop-settings.controller';
import { WorkshopSettingsService } from './workshop-settings.service';

/**
 * Workshop settings feature module.
 *
 * Imports AuthModule because settings routes are protected with AuthGuard and
 * scoped by the authenticated user's workshopId.
 */
@Module({
  imports: [AuthModule],
  controllers: [WorkshopSettingsController],
  providers: [WorkshopSettingsService, WorkshopLogoStorageService],
})
export class WorkshopSettingsModule {}
