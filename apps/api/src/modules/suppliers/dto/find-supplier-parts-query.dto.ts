import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  SUPPLIER_ARCHIVE_STATUSES,
  type SupplierArchiveStatus,
} from './find-suppliers-query.dto';

export const SUPPLIER_PART_ACTIVE_STATUSES = [
  'active',
  'inactive',
  'all',
] as const;

export type SupplierPartActiveStatus =
  (typeof SUPPLIER_PART_ACTIVE_STATUSES)[number];

/**
 * Query params accepted by the supplier parts catalog endpoint.
 */
export class FindSupplierPartsQueryDto {
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
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsIn([...SUPPLIER_ARCHIVE_STATUSES])
  archiveStatus?: SupplierArchiveStatus;

  @IsOptional()
  @IsIn([...SUPPLIER_PART_ACTIVE_STATUSES])
  activeStatus?: SupplierPartActiveStatus;
}
