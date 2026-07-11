import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SupplierMarkupType } from '@prisma/client';

const MAX_MONEY_VALUE = 9999999999.99;
const MAX_QUANTITY = 999999.99;

/**
 * Converts empty form values into undefined so optional DTO fields behave
 * correctly when forms send blank selects or inputs.
 */
function emptyToUndefined(value: unknown): unknown {
  return value === '' ? undefined : value;
}

/**
 * One structured part/purchase line inside a work order.
 *
 * The backend stores both supplier cost and customer-facing price so supplier
 * debt and part margin can be calculated later in reports.
 */
export class WorkOrderPartLineDto {
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  supplierPartId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  partName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(MAX_QUANTITY)
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  supplierUnitCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  customerUnitPrice?: number;

  @IsOptional()
  @IsEnum(SupplierMarkupType)
  markupType?: SupplierMarkupType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  markupValue?: number;

  @IsOptional()
  @IsDateString()
  purchasedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
