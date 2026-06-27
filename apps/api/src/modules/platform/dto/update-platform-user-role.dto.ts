import { WorkshopRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

/**
 * Validates platform user role updates.
 */
export class UpdatePlatformUserRoleDto {
  @IsEnum(WorkshopRole)
  role!: WorkshopRole;
}
