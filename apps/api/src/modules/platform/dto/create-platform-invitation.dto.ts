import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { WorkshopRole } from '@prisma/client';

/**
 * Normalizes email input before validation and persistence.
 */
function normalizeEmailValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

/**
 * Payload used by an internal administrator to invite a workshop user.
 */
export class CreatePlatformInvitationDto {
  @Transform(({ value }: { value: unknown }) => normalizeEmailValue(value))
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(WorkshopRole)
  role?: WorkshopRole;
}
