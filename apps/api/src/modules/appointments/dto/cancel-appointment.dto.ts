import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

const MAX_CANCEL_REASON_LENGTH = 800;

/**
 * Payload required to cancel an appointment.
 *
 * Cancellation requires a reason to keep operational traceability without
 * deleting agenda data.
 */
export class CancelAppointmentDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(MAX_CANCEL_REASON_LENGTH)
  reason!: string;
}
