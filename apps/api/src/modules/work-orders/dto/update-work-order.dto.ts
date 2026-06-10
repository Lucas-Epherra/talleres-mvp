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
  @MaxLength(500)
  diagnosis?: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  workDone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  partsUsed?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2000000)
  entryMileage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  laborCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  partsCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedTotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  finalTotal?: number;

  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}