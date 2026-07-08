import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Reason required before restoring an archived supplier.
 */
export class RestoreSupplierDto {
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  reason!: string;
}
