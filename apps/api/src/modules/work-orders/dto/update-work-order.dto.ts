import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { WorkOrderStatus } from '@prisma/client';

const MAX_MILEAGE = 2000000;
const MAX_MONEY_VALUE = 9999999999.99;

/**
 * Converts nullable number payloads into values that class-validator and the
 * service layer can handle safely.
 *
 * PATCH forms use null to explicitly clear optional numeric fields.
 */
function nullableNumberTransform(value: unknown): unknown {
  if (value === null || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return Number(value);
  }

  return value;
}

/**
 * Payload accepted when updating a work order.
 *
 * All fields are optional because PATCH requests may update only part of the
 * work order. Nullable fields support explicit clearing from the edit form.
 */
export class UpdateWorkOrderDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reportedIssue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  diagnosis?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  workDone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  partsUsed?: string | null;

  @IsOptional()
  @Transform(({ value }) => nullableNumberTransform(value))
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_MILEAGE)
  entryMileage?: number | null;

  @IsOptional()
  @Transform(({ value }) => nullableNumberTransform(value))
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  laborCost?: number | null;

  @IsOptional()
  @Transform(({ value }) => nullableNumberTransform(value))
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  partsCost?: number | null;

  @IsOptional()
  @Transform(({ value }) => nullableNumberTransform(value))
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  estimatedTotal?: number | null;

  @IsOptional()
  @Transform(({ value }) => nullableNumberTransform(value))
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  finalTotal?: number | null;

  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  notes?: string | null;
}
