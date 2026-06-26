import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

const MAX_ARCHIVE_REASON_LENGTH = 800;

/**
 * Trims string values while preserving invalid non-string payloads so
 * class-validator can reject them correctly.
 */
function trimStringValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Payload required to archive a vehicle.
 *
 * Archiving is an operationally critical action, so a reason is mandatory for
 * future auditability.
 */
export class ArchiveVehicleDto {
  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsString()
  @MinLength(3)
  @MaxLength(MAX_ARCHIVE_REASON_LENGTH)
  reason!: string;
}
