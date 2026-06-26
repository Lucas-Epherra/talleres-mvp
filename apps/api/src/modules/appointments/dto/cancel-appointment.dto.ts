import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

const MAX_CANCEL_REASON_LENGTH = 800;

/**
 * Trims string values while preserving invalid non-string payloads so
 * class-validator can reject them correctly.
 */
function trimStringValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Payload required to cancel an appointment.
 *
 * Cancellation requires a reason to keep operational traceability without
 * deleting agenda data.
 */
export class CancelAppointmentDto {
  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsString()
  @MinLength(3)
  @MaxLength(MAX_CANCEL_REASON_LENGTH)
  reason!: string;
}
