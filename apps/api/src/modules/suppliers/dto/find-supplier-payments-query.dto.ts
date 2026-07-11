import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SupplierPaymentMethod } from '@prisma/client';

export const SUPPLIER_PAYMENT_STATUSES = ['active', 'voided', 'all'] as const;

export type SupplierPaymentStatus =
  (typeof SUPPLIER_PAYMENT_STATUSES)[number];

/**
 * Query params accepted by the supplier payments endpoint.
 */
export class FindSupplierPaymentsQueryDto {
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
  @IsEnum(SupplierPaymentMethod)
  method?: SupplierPaymentMethod;

  @IsOptional()
  @IsIn([...SUPPLIER_PAYMENT_STATUSES])
  paymentStatus?: SupplierPaymentStatus;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
