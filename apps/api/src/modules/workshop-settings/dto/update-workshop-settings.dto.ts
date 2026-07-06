import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Payload used to update the authenticated workshop settings.
 *
 * All fields are optional because the endpoint supports partial updates.
 * Logo fields are intentionally excluded: logos are handled through the
 * dedicated upload/delete endpoints.
 */
export class UpdateWorkshopSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(700)
  businessHours?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}
