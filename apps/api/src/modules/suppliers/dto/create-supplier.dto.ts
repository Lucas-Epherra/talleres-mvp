import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

function optionalStringTransform(value: unknown): unknown {
  if (value === null || value === '') {
    return undefined;
  }

  return value;
}

/**
 * Payload accepted when creating a supplier.
 */
export class CreateSupplierDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @Transform(({ value }) => optionalStringTransform(value))
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @IsOptional()
  @Transform(({ value }) => optionalStringTransform(value))
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @Transform(({ value }) => optionalStringTransform(value))
  @IsEmail()
  @MaxLength(180)
  email?: string;

  @IsOptional()
  @Transform(({ value }) => optionalStringTransform(value))
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @IsOptional()
  @Transform(({ value }) => optionalStringTransform(value))
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @Transform(({ value }) => optionalStringTransform(value))
  @IsString()
  @MaxLength(800)
  notes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  categoryNames?: string[];
}
