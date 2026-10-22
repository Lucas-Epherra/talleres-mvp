// Sentry must load before every other module.
import './instrument';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

/**
 * Bootstraps the NestJS API application.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  const port = process.env.PORT ?? 3001;

  await app.listen(port);
}

void bootstrap();
