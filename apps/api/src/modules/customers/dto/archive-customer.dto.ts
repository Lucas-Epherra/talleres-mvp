import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

const MAX_ARCHIVE_REASON_LENGTH = 800;

/**
 * Payload required to archive a customer.
 *
 * Archiving is an operational action, so a reason is mandatory for
 * traceability.
 */
export class ArchiveCustomerDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(MAX_ARCHIVE_REASON_LENGTH)
  reason!: string;
}
