import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

const MAX_ARCHIVE_REASON_LENGTH = 800;

/**
 * Payload required to archive a vehicle.
 *
 * Archiving is an operationally critical action, so a reason is mandatory for
 * future auditability.
 */
export class ArchiveVehicleDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(MAX_ARCHIVE_REASON_LENGTH)
  reason!: string;
}
