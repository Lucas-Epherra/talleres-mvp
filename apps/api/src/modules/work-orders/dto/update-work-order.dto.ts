import { Type } from 'class-transformer';
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
 * Payload accepted when updating a work order.
 *
 * All fields are optional because PATCH requests may update only part of the
 * work order.
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
  diagnosis?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  workDone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  partsUsed?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_MILEAGE)
  entryMileage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  laborCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  partsCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  estimatedTotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  finalTotal?: number;

  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  notes?: string;
}
