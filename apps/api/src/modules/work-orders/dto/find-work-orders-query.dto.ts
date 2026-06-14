import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { WorkOrderStatus } from '@prisma/client';

/**
 * Query params accepted when listing work orders.
 */
export class FindWorkOrdersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;
}
