/**
 * Environment for e2e tests, loaded by Jest before any test module.
 *
 * AuthModule reads JWT settings when it is imported, so these values must be
 * in place before AppModule is required. Real secrets are never needed here.
 */
const DEFAULT_TEST_ENV: Record<string, string> = {
  NODE_ENV: 'test',
  JWT_ACCESS_SECRET: 'e2e-only-secret-not-used-anywhere-else-0000',
  JWT_ACCESS_EXPIRES_IN_SECONDS: '3600',
  CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
  AUTH_COOKIE_SAME_SITE: 'lax',
  AUTH_COOKIE_SECURE: 'false',
  TRUST_PROXY_HOPS: '0',
};

for (const [key, value] of Object.entries(DEFAULT_TEST_ENV)) {
  process.env[key] ??= value;
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required for e2e tests. Point it to a disposable database.',
  );
}

// e2e suites create and delete rows. Refuse anything that does not look like a
// throwaway database so a misconfigured shell never touches real data.
const databaseName = new URL(databaseUrl).pathname.replace('/', '');

if (!/test/i.test(databaseName) && process.env.E2E_ALLOW_ANY_DATABASE !== '1') {
  throw new Error(
    `Refusing to run e2e tests against database "${databaseName}". Use a database whose name contains "test".`,
  );
}
