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

function optionalStringTransform(value: unknown): unknown {
  if (value === null || value === '') {
    return undefined;
  }

  return value;
}

function optionalNumberTransform(value: unknown): unknown {
  if (value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    return Number(value);
  }

  return value;
}

/**
 * Payload accepted when creating a catalog part for a supplier.
 *
 * currentCost represents the supplier cost. suggestedCustomerPrice represents
 * the suggested price charged to the customer after markup.
 */
export class CreateSupplierPartDto {
  @IsOptional()
  @Transform(({ value }) => optionalStringTransform(value))
  @IsUUID()
  categoryId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @Transform(({ value }) => optionalStringTransform(value))
  @IsString()
  @MaxLength(80)
  sku?: string;

  @IsOptional()
  @Transform(({ value }) => optionalStringTransform(value))
  @IsString()
  @MaxLength(500)
  description?: string;

  @Transform(({ value }) => optionalNumberTransform(value))
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  currentCost!: number;

  @IsOptional()
  @IsEnum(SupplierMarkupType)
  suggestedMarkupType?: SupplierMarkupType;

  @IsOptional()
  @Transform(({ value }) => optionalNumberTransform(value))
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MARKUP_VALUE)
  suggestedMarkupValue?: number;

  @IsOptional()
  @Transform(({ value }) => optionalNumberTransform(value))
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  suggestedCustomerPrice?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
