import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

const MAX_RESTORE_REASON_LENGTH = 800;

/**
 * Trims string values while preserving invalid non-string payloads so
 * class-validator can reject them correctly.
 */
function trimStringValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Payload required to restore an archived vehicle.
 *
 * Restoring changes operational availability, so a reason is mandatory.
 */
export class RestoreVehicleDto {
  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsString()
  @MinLength(3)
  @MaxLength(MAX_RESTORE_REASON_LENGTH)
  reason!: string;
}
