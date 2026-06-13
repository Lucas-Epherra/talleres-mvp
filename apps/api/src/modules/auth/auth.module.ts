import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';

const DEFAULT_ACCESS_TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;
const MAX_ACCESS_TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;

/**
 * Reads and validates the JWT access token secret.
 *
 * The API must fail fast when the secret is missing because using a fallback
 * secret would make every issued token predictable across environments.
 */
function getJwtAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET?.trim();

  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is required.');
  }

  if (
    process.env.NODE_ENV === 'production' &&
    (secret.length < 32 || secret.includes('change_me'))
  ) {
    throw new Error(
      'JWT_ACCESS_SECRET must be a strong production secret with at least 32 characters.',
    );
  }

  return secret;
}

/**
 * Reads and validates the JWT access token expiration in seconds.
 *
 * The token expiration should stay aligned with the httpOnly cookie maxAge.
 */
function getJwtAccessExpiresInSeconds(): number {
  const rawValue = process.env.JWT_ACCESS_EXPIRES_IN_SECONDS;
  const parsedValue = rawValue
    ? Number(rawValue)
    : DEFAULT_ACCESS_TOKEN_EXPIRES_IN_SECONDS;

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue <= 0 ||
    parsedValue > MAX_ACCESS_TOKEN_EXPIRES_IN_SECONDS
  ) {
    throw new Error(
      `JWT_ACCESS_EXPIRES_IN_SECONDS must be an integer between 1 and ${MAX_ACCESS_TOKEN_EXPIRES_IN_SECONDS}.`,
    );
  }

  return parsedValue;
}

/**
 * Authentication feature module.
 *
 * Exports AuthService and AuthGuard so protected feature modules can resolve
 * authentication dependencies correctly.
 */
@Module({
  imports: [
    JwtModule.register({
      secret: getJwtAccessSecret(),
      signOptions: {
        expiresIn: getJwtAccessExpiresInSeconds(),
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}