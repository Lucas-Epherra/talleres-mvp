import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SupplierPaymentMethod } from '@prisma/client';

const MAX_MONEY_VALUE = 9999999999.99;

function nullableStringTransform(value: unknown): unknown {
  if (value === '') {
    return null;
  }

  return value;
}

function nullableNumberTransform(value: unknown): unknown {
  if (value === null || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    return Number(value);
  }

  return value;
}

/**
 * Payload accepted when correcting a supplier payment.
 *
 * Voided payments cannot be edited; use the explicit void action to keep the
 * payment history auditable.
 */
export class UpdateSupplierPaymentDto {
  @IsOptional()
  @Transform(({ value }) => nullableNumberTransform(value))
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(MAX_MONEY_VALUE)
  amount?: number | null;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsEnum(SupplierPaymentMethod)
  method?: SupplierPaymentMethod;

  @IsOptional()
  @Transform(({ value }) => nullableStringTransform(value))
  @IsString()
  @MaxLength(120)
  reference?: string | null;

  @IsOptional()
  @Transform(({ value }) => nullableStringTransform(value))
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
