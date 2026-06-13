import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const MAX_ALLOWED_VEHICLE_YEAR = new Date().getFullYear() + 1;

/**
 * Payload accepted when updating a vehicle.
 *
 * All fields are optional because PATCH requests may update only part of the
 * vehicle profile.
 */
export class UpdateVehicleDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^(?=.*[A-Za-z0-9])[A-Za-z0-9\s-]+$/, {
    message:
      'La patente solo puede contener letras, números, espacios o guiones.',
  })
  licensePlate?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  brand?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  model?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(MAX_ALLOWED_VEHICLE_YEAR)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2000000)
  mileage?: number;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  notes?: string;
}