import { type INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import type { Express } from 'express';
import helmet from 'helmet';
import {
  createOriginCheckMiddleware,
  getAllowedOrigins,
  getTrustProxyHops,
  isOriginAllowed,
} from './common/security/http-security';

type CorsOriginCallback = (error: Error | null, allow?: boolean) => void;

/**
 * Applies the HTTP pipeline shared by the real server and e2e tests: security
 * headers, global prefix, CORS, Origin check, cookies and validation.
 *
 * Keeping it in one place guarantees tests exercise the same configuration
 * that runs in production.
 */
export function configureApp(app: INestApplication): void {
  const allowedOrigins = getAllowedOrigins();
  const expressApp = app.getHttpAdapter().getInstance() as Express;

  expressApp.disable('x-powered-by');
  expressApp.set('trust proxy', getTrustProxyHops());

  // Same-site lets the web (www.) load API resources such as receipt PDFs.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: CorsOriginCallback,
    ): void => {
      // Disallowed origins get no CORS headers; the Origin check returns 403.
      callback(null, isOriginAllowed(origin, allowedOrigins));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(createOriginCheckMiddleware(allowedOrigins));
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
}
