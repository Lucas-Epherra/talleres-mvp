import { IsOptional, IsUUID } from 'class-validator';

/**
 * Query params supported by the receipts list endpoint.
 */
export class FindReceiptsQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'El id de la orden no es válido.' })
  workOrderId?: string;
}