import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Payload required to create a vehicle associated with an existing customer.
 */
export class CreateVehicleDto {
  @IsUUID()
  customerId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
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
  @Max(2100)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2000000)
  mileage?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}