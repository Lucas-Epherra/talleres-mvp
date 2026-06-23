import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

const MAX_RESTORE_REASON_LENGTH = 800;

/**
 * Payload required to restore an archived customer.
 *
 * Restoring changes operational availability, so a reason is mandatory.
 */
export class RestoreCustomerDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(MAX_RESTORE_REASON_LENGTH)
  reason!: string;
}
