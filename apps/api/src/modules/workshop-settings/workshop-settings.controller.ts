import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorkshopRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { UpdateWorkshopSettingsDto } from './dto/update-workshop-settings.dto';
import type { UploadedLogoFile } from './types/uploaded-logo-file.type';
import { WorkshopSettingsService } from './workshop-settings.service';

const MAX_LOGO_UPLOAD_BYTES = 1024 * 1024;

/**
 * HTTP controller for authenticated workshop settings.
 *
 * These endpoints are tenant-scoped by the authenticated user's workshopId.
 */
@Controller('workshop/settings')
@UseGuards(AuthGuard, RolesGuard)
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
   * Updates text-based settings for the authenticated workshop.
   */
  @Patch()
  @Roles(WorkshopRole.OWNER, WorkshopRole.ADMIN)
  updateSettings(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateWorkshopSettingsDto,
  ) {
    return this.workshopSettingsService.updateSettings(user.workshopId, dto);
  }

  /**
   * Uploads and replaces the authenticated workshop logo.
   */
  @Post('logo')
  @Roles(WorkshopRole.OWNER, WorkshopRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: {
        fileSize: MAX_LOGO_UPLOAD_BYTES,
      },
    }),
  )
  uploadLogo(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: UploadedLogoFile,
  ) {
    if (!file) {
      throw new BadRequestException('Seleccioná una imagen para subir.');
    }

    return this.workshopSettingsService.uploadLogo(user.workshopId, file);
  }

  /**
   * Removes the authenticated workshop logo.
   */
  @Delete('logo')
  @Roles(WorkshopRole.OWNER, WorkshopRole.ADMIN)
  deleteLogo(@CurrentUser() user: AuthUser) {
    return this.workshopSettingsService.deleteLogo(user.workshopId);
  }
}
