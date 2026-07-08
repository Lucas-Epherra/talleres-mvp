import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Reason required before archiving a supplier.
 */
export class ArchiveSupplierDto {
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  reason!: string;
}
