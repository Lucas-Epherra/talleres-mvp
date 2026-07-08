import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const SUPPLIER_ARCHIVE_STATUSES = ['active', 'archived', 'all'] as const;

export type SupplierArchiveStatus = (typeof SUPPLIER_ARCHIVE_STATUSES)[number];

/**
 * Query params accepted by the suppliers list endpoint.
 *
 * The list is paginated because workshops can accumulate a long history of
 * suppliers, purchases and debts over time.
 */
export class FindSuppliersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn([...SUPPLIER_ARCHIVE_STATUSES])
  archiveStatus?: SupplierArchiveStatus;
}
