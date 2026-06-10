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
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import type { AuthUser } from './types/auth-user.type';

const ACCESS_TOKEN_COOKIE_NAME = 'access_token';

/**
 * HTTP controller for authentication operations.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Authenticates a user and stores the access token in an httpOnly cookie.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);

    res.cookie(ACCESS_TOKEN_COOKIE_NAME, result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

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
    res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });

    return {
      message: 'Logged out successfully.',
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