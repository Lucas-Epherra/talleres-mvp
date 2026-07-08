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
import {
  SUPPLIER_ARCHIVE_STATUSES,
  type SupplierArchiveStatus,
} from './find-suppliers-query.dto';

/**
 * Query params accepted by the supplier categories endpoint.
 */
export class FindSupplierCategoriesQueryDto {
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
  @MaxLength(80)
  search?: string;

  @IsOptional()
  @IsIn([...SUPPLIER_ARCHIVE_STATUSES])
  archiveStatus?: SupplierArchiveStatus;
}
