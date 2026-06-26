import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const MAX_WORKSHOP_NAME_LENGTH = 120;
const MAX_WORKSHOP_SLUG_LENGTH = 80;

const WORKSHOP_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Trims string values while preserving invalid non-string payloads so
 * class-validator can reject them correctly.
 */
function trimStringValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Normalizes optional slug input.
 */
function normalizeOptionalSlug(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalizedValue = value.trim().toLowerCase();

  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

/**
 * Payload required by a platform owner to create a SaaS workshop tenant.
 */
export class CreatePlatformWorkshopDto {
  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsString()
  @MinLength(3)
  @MaxLength(MAX_WORKSHOP_NAME_LENGTH)
  name!: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => normalizeOptionalSlug(value))
  @IsString()
  @MinLength(3)
  @MaxLength(MAX_WORKSHOP_SLUG_LENGTH)
  @Matches(WORKSHOP_SLUG_PATTERN, {
    message:
      'El slug solo puede contener letras minúsculas, números y guiones simples.',
  })
  slug?: string;
}
