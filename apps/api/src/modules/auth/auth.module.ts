import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';

const ACCESS_TOKEN_EXPIRES_IN_SECONDS = Number(
  process.env.JWT_ACCESS_EXPIRES_IN_SECONDS ?? 604800,
);

/**
 * Authentication feature module.
 *
 * Exports AuthService and AuthGuard so protected feature modules can resolve
 * authentication dependencies correctly.
 */
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? 'local_fallback_secret',
      signOptions: {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}