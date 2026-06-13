import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000'];

/**
 * Reads allowed frontend origins from environment variables.
 *
 * CORS must never be configured with a wildcard when credentials/cookies are
 * enabled. Use a comma-separated list for production and preview deployments.
 *
 * Example:
 * CORS_ALLOWED_ORIGINS="http://localhost:3000,https://talleres.example.com"
 */
function getAllowedOrigins(): string[] {
  const rawOrigins =
    process.env.CORS_ALLOWED_ORIGINS ?? process.env.FRONTEND_URL ?? '';

  const origins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : DEFAULT_ALLOWED_ORIGINS;
}

/**
 * Allows browser requests only from configured origins.
 *
 * Requests without Origin are allowed because they usually come from curl,
 * Postman, health checks or server-to-server calls.
 */
function isOriginAllowed(
  requestOrigin: string | undefined,
  allowedOrigins: string[],
): boolean {
  if (!requestOrigin) {
    return true;
  }

  return allowedOrigins.includes(requestOrigin);
}

/**
 * Bootstraps the NestJS API application.
 *
 * The API runs on port 3001 to avoid conflicts with the Next.js frontend,
 * which runs on port 3000 during local development.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = getAllowedOrigins();
  const expressApp = app.getHttpAdapter().getInstance();

  if (typeof expressApp.disable === 'function') {
    expressApp.disable('x-powered-by');
  }

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  const port = process.env.PORT ?? 3001;

  await app.listen(port);
}

void bootstrap();