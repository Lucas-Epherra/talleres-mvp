import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Reason required before restoring a supplier catalog part.
 */
export class RestoreSupplierPartDto {
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  reason!: string;
}
