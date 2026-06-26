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
 * Payload required to create an appointment inside the workshop agenda.
 *
 * Dates are stored as absolute DateTime values so the same model can later feed
 * agenda, day, week or calendar views.
 */
export class CreateAppointmentDto {
  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsISO8601({ strict: true })
  scheduledStart!: string;

  @IsISO8601({ strict: true })
  scheduledEnd!: string;

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
