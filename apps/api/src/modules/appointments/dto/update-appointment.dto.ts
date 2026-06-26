import { Transform } from 'class-transformer';
import {
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Trims string values while preserving invalid non-string payloads so
 * class-validator can reject them correctly.
 */
function trimStringValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Payload accepted when editing an appointment that is still operational.
 *
 * Completed and cancelled appointments are intentionally immutable from the
 * normal edit flow.
 */
export class UpdateAppointmentDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  scheduledStart?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  scheduledEnd?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsUUID()
  workOrderId?: string;
}
