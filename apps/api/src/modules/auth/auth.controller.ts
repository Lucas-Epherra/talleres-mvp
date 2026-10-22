import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import type { AuthUser } from './types/auth-user.type';

const ACCESS_TOKEN_COOKIE_NAME = 'access_token';
const DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const VALID_SAME_SITE_VALUES = ['lax', 'strict', 'none'] as const;

type CookieSameSite = (typeof VALID_SAME_SITE_VALUES)[number];

/**
 * Safely parses the access token cookie max age from environment variables.
 */
function getAccessTokenMaxAgeMs(): number {
  const rawMaxAge = process.env.JWT_ACCESS_EXPIRES_IN_SECONDS;
  const parsedMaxAge = rawMaxAge ? Number(rawMaxAge) : NaN;

  if (
    Number.isInteger(parsedMaxAge) &&
    parsedMaxAge > 0 &&
    parsedMaxAge <= DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS
  ) {
    return parsedMaxAge * 1000;
  }

  return DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS * 1000;
}

/**
 * Reads the cookie SameSite mode.
 *
 * Defaults to lax: web and API live on subdomains of the same site, so the
 * cookie is still sent on API calls while cross-site POSTs carry no session.
 * Use none only when the frontend runs on a different site (e.g. preview
 * domains); the Origin check middleware is then the CSRF protection.
 */
function getCookieSameSite(): CookieSameSite {
  const rawSameSite = process.env.AUTH_COOKIE_SAME_SITE?.toLowerCase();

  if (
    rawSameSite &&
    VALID_SAME_SITE_VALUES.includes(rawSameSite as CookieSameSite)
  ) {
    return rawSameSite as CookieSameSite;
  }

  return 'lax';
}

/**
 * Determines if auth cookies must be sent only over HTTPS.
 */
function shouldUseSecureCookie(): boolean {
  if (process.env.AUTH_COOKIE_SECURE === 'true') {
    return true;
  }

  if (process.env.AUTH_COOKIE_SECURE === 'false') {
    return false;
  }

  return process.env.NODE_ENV === 'production';
}

/**
 * Reads the cookie domain used to share auth between app and API subdomains.
 */
function getCookieDomain(): string | undefined {
  const rawDomain = process.env.AUTH_COOKIE_DOMAIN?.trim();

  return rawDomain || undefined;
}

/**
 * Builds the access token cookie options used by login and logout.
 */
function getAccessTokenCookieOptions(): CookieOptions {
  const sameSite = getCookieSameSite();

  return {
    httpOnly: true,
    sameSite,
    secure: sameSite === 'none' ? true : shouldUseSecureCookie(),
    domain: getCookieDomain(),
    path: '/',
    maxAge: getAccessTokenMaxAgeMs(),
  };
}

/**
 * Builds the cookie options required to clear the access token cookie.
 */
function getClearAccessTokenCookieOptions(): CookieOptions {
  const cookieOptions = getAccessTokenCookieOptions();

  return {
    httpOnly: cookieOptions.httpOnly,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
    domain: cookieOptions.domain,
    path: cookieOptions.path,
  };
}

/**
 * HTTP controller for authentication operations.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Authenticates a user and stores the access token in an httpOnly cookie.
   *
   * Rate limited per IP and per email to slow down credential brute force.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);

    res.cookie(
      ACCESS_TOKEN_COOKIE_NAME,
      result.accessToken,
      getAccessTokenCookieOptions(),
    );

    return {
      user: result.user,
      workshop: result.workshop,
    };
  }

  /**
   * Clears the authentication cookie.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(
      ACCESS_TOKEN_COOKIE_NAME,
      getClearAccessTokenCookieOptions(),
    );

    return {
      message: 'Sesión cerrada correctamente.',
    };
  }

  /**
   * Returns the authenticated user context.
   */
  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return {
      user,
    };
  }
}
