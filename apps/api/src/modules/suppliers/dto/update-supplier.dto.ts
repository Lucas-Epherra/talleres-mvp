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

function nullableStringTransform(value: unknown): unknown {
  if (value === '') {
    return null;
  }

  return value;
}

/**
 * Payload accepted when updating a supplier.
 *
 * Null values explicitly clear optional fields. categoryNames replaces the
 * current category assignment only when the property is present.
 */
export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @Transform(({ value }) => nullableStringTransform(value))
  @IsString()
  @MaxLength(120)
  contactName?: string | null;

  @IsOptional()
  @Transform(({ value }) => nullableStringTransform(value))
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @IsOptional()
  @Transform(({ value }) => nullableStringTransform(value))
  @IsEmail()
  @MaxLength(180)
  email?: string | null;

  @IsOptional()
  @Transform(({ value }) => nullableStringTransform(value))
  @IsString()
  @MaxLength(50)
  taxId?: string | null;

  @IsOptional()
  @Transform(({ value }) => nullableStringTransform(value))
  @IsString()
  @MaxLength(200)
  address?: string | null;

  @IsOptional()
  @Transform(({ value }) => nullableStringTransform(value))
  @IsString()
  @MaxLength(800)
  notes?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  categoryNames?: string[];
}
