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

export const VEHICLE_ARCHIVE_STATUSES = ['active', 'archived', 'all'] as const;

export type VehicleArchiveStatus = (typeof VEHICLE_ARCHIVE_STATUSES)[number];

/**
 * Query parameters accepted by the vehicles list endpoint.
 *
 * Pagination is server-side because real workshops can accumulate many vehicle
 * records. Search remains optional and is always scoped by workshopId in the
 * service layer.
 */
export class FindVehiclesQueryDto {
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
  @IsIn([...VEHICLE_ARCHIVE_STATUSES])
  archiveStatus?: VehicleArchiveStatus;
}
