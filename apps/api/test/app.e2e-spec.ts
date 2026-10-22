import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import request from 'supertest';
import { API_PREFIX, createTestApp } from './utils/test-app';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health answers without authentication', async () => {
    const response = await request(app.getHttpServer())
      .get(`${API_PREFIX}/health`)
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'talleres-api',
    });
  });

  it('rejects protected routes without a session', async () => {
    await request(app.getHttpServer())
      .get(`${API_PREFIX}/customers`)
      .expect(401);
  });
});
