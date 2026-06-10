import { WorkOrderStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

/**
 * Payload used to update only the operational status of a work order.
 */
export class UpdateWorkOrderStatusDto {
  @IsEnum(WorkOrderStatus)
  status!: WorkOrderStatus;
}