import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

/**
 * Normalizes invitation token input from query params.
 */
function normalizeTokenValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Query payload used to inspect an invitation before acceptance.
 */
export class InvitationTokenDto {
  @Transform(({ value }: { value: unknown }) => normalizeTokenValue(value))
  @IsString()
  @MinLength(20)
  token!: string;
}
