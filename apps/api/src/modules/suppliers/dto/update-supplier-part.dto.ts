import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { SupplierMarkupType } from '@prisma/client';

const MAX_MONEY_VALUE = 9999999999.99;
const MAX_MARKUP_VALUE = 1000000;

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
 * Payload accepted when updating one supplier part.
 *
 * Null values explicitly clear optional fields such as category, SKU,
 * description or manual markup values.
 */
export class UpdateSupplierPartDto {
  @IsOptional()
  @Transform(({ value }) => nullableStringTransform(value))
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @Transform(({ value }) => nullableStringTransform(value))
  @IsString()
  @MaxLength(80)
  sku?: string | null;

  @IsOptional()
  @Transform(({ value }) => nullableStringTransform(value))
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @Transform(({ value }) => nullableNumberTransform(value))
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  currentCost?: number | null;

  @IsOptional()
  @IsEnum(SupplierMarkupType)
  suggestedMarkupType?: SupplierMarkupType;

  @IsOptional()
  @Transform(({ value }) => nullableNumberTransform(value))
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MARKUP_VALUE)
  suggestedMarkupValue?: number | null;

  @IsOptional()
  @Transform(({ value }) => nullableNumberTransform(value))
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  suggestedCustomerPrice?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
