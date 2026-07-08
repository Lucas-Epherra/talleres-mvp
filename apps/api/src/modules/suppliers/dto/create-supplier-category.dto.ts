import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

function optionalStringTransform(value: unknown): unknown {
  if (value === null || value === '') {
    return undefined;
  }

  return value;
}

/**
 * Payload accepted when creating a supplier category.
 */
export class CreateSupplierCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name!: string;

  @IsOptional()
  @Transform(({ value }) => optionalStringTransform(value))
  @IsString()
  @MaxLength(200)
  description?: string;
}
