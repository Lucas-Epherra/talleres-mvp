import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{10,72}$/;

/**
 * Trims string values while preserving invalid non-string payloads so
 * class-validator can reject them correctly.
 */
function trimStringValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Password is intentionally strict because invited users can access workshop
 * operational data.
 */
export class AcceptPlatformInvitationDto {
  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsString()
  @MinLength(20)
  token!: string;

  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(72)
  @Matches(PASSWORD_PATTERN, {
    message:
      'La contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula, un número y un símbolo.',
  })
  password!: string;
}
