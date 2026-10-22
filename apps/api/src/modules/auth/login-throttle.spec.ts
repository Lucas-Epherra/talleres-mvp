import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  LOGIN_EMAIL_LIMIT,
  LOGIN_IP_LIMIT,
  LOGIN_THROTTLE_MESSAGE,
  LOGIN_THROTTLER_OPTIONS,
} from './login-throttle.config';

const PASSWORD = 'password123';

/**
 * Boots AuthController with the real throttler config and a mocked service.
 */
async function createApp(): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({
    imports: [ThrottlerModule.forRoot(LOGIN_THROTTLER_OPTIONS)],
    controllers: [AuthController],
    providers: [
      {
        provide: AuthService,
        useValue: {
          login: jest.fn().mockResolvedValue({
            accessToken: 'token',
            user: {},
            workshop: {},
          }),
        },
      },
    ],
  }).compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>();
  await app.init();

  return app;
}

describe('POST /auth/login rate limiting', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.close();
  });

  /**
   * Sends one login attempt for the given email.
   */
  function login(email: string) {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: PASSWORD });
  }

  it('blocks an email after the per-email limit, ignoring case and spaces', async () => {
    for (let attempt = 0; attempt < LOGIN_EMAIL_LIMIT; attempt += 1) {
      await login('owner@taller.test').expect(200);
    }

    const response = await login('  OWNER@taller.test ').expect(429);

    expect(response.body).toMatchObject({ message: LOGIN_THROTTLE_MESSAGE });
    await login('other@taller.test').expect(200);
  });

  it('blocks an IP after the per-IP limit across different emails', async () => {
    for (let attempt = 0; attempt < LOGIN_IP_LIMIT; attempt += 1) {
      await login(`user${attempt}@taller.test`).expect(200);
    }

    await login('new@taller.test').expect(429);
  });
});
