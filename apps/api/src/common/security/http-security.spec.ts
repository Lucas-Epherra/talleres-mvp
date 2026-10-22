import express from 'express';
import request from 'supertest';
import {
  createOriginCheckMiddleware,
  getTrustProxyHops,
} from './http-security';

const ALLOWED_ORIGIN = 'https://www.mitaller360.com';

/**
 * Builds a minimal Express app protected by the Origin check.
 */
function createApp() {
  const app = express();

  app.use(createOriginCheckMiddleware([ALLOWED_ORIGIN]));
  app.all('/resource', (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}

describe('createOriginCheckMiddleware', () => {
  const app = createApp();

  it('allows mutations from an allowed origin', async () => {
    await request(app)
      .post('/resource')
      .set('Origin', ALLOWED_ORIGIN)
      .expect(200);
  });

  it('rejects mutations from other origins', async () => {
    const response = await request(app)
      .post('/resource')
      .set('Origin', 'https://evil.example')
      .expect(403);

    expect(response.body).toMatchObject({ message: 'Origen no permitido.' });
  });

  it('rejects the opaque null origin', async () => {
    await request(app).delete('/resource').set('Origin', 'null').expect(403);
  });

  it('rejects cross-site mutations without Origin', async () => {
    await request(app)
      .patch('/resource')
      .set('Sec-Fetch-Site', 'cross-site')
      .expect(403);
  });

  it('allows non-browser clients without Origin', async () => {
    await request(app).post('/resource').expect(200);
  });

  it('does not block safe methods', async () => {
    await request(app)
      .get('/resource')
      .set('Origin', 'https://evil.example')
      .expect(200);
  });
});

describe('getTrustProxyHops', () => {
  const originalValue = process.env.TRUST_PROXY_HOPS;

  afterEach(() => {
    process.env.TRUST_PROXY_HOPS = originalValue;
  });

  it('defaults to 0 when unset', () => {
    delete process.env.TRUST_PROXY_HOPS;

    expect(getTrustProxyHops()).toBe(0);
  });

  it('parses a valid hop count', () => {
    process.env.TRUST_PROXY_HOPS = '1';

    expect(getTrustProxyHops()).toBe(1);
  });

  it('fails fast on invalid values', () => {
    process.env.TRUST_PROXY_HOPS = 'true';

    expect(() => getTrustProxyHops()).toThrow();
  });
});
