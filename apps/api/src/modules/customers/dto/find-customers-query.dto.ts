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

export const CUSTOMER_ARCHIVE_STATUSES = ['active', 'archived', 'all'] as const;

export type CustomerArchiveStatus = (typeof CUSTOMER_ARCHIVE_STATUSES)[number];

/**
 * Query parameters accepted by the customers list endpoint.
 *
 * Pagination is server-side because customer lists can grow quickly in real
 * workshops. Search remains optional and is always scoped by workshopId in the
 * service layer.
 */
export class FindCustomersQueryDto {
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
  @IsIn([...CUSTOMER_ARCHIVE_STATUSES])
  archiveStatus?: CustomerArchiveStatus;
}
