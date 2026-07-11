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

function optionalStringTransform(value: unknown): unknown {
  if (value === null || value === '') {
    return undefined;
  }

  return value;
}

function requiredNumberTransform(value: unknown): unknown {
  if (typeof value === 'string') {
    return Number(value);
  }

  return value;
}

/**
 * Payload accepted when registering a payment made to a supplier.
 */
export class CreateSupplierPaymentDto {
  @Transform(({ value }) => requiredNumberTransform(value))
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(MAX_MONEY_VALUE)
  amount!: number;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsEnum(SupplierPaymentMethod)
  method?: SupplierPaymentMethod;

  @IsOptional()
  @Transform(({ value }) => optionalStringTransform(value))
  @IsString()
  @MaxLength(120)
  reference?: string;

  @IsOptional()
  @Transform(({ value }) => optionalStringTransform(value))
  @IsString()
  @MaxLength(500)
  notes?: string;
}
