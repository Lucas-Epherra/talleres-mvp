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
 * Payload required to create a vehicle associated with an existing customer.
 */
export class CreateVehicleDto {
  @IsUUID()
  customerId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^(?=.*[A-Za-z0-9])[A-Za-z0-9\s-]+$/, {
    message:
      'La patente solo puede contener letras, números, espacios o guiones.',
  })
  licensePlate!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  brand!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  model!: string;

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