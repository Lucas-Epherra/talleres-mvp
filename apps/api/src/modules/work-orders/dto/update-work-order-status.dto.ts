import { IsEnum } from 'class-validator';
import { WorkOrderStatus } from '@prisma/client';

/**
 * Payload accepted when updating only the operational status of a work order.
 */
export class UpdateWorkOrderStatusDto {
  @IsEnum(WorkOrderStatus)
  status!: WorkOrderStatus;
}
