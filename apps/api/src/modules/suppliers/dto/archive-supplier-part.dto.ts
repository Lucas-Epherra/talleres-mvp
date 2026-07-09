import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Reason required before archiving a supplier catalog part.
 */
export class ArchiveSupplierPartDto {
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  reason!: string;
}
