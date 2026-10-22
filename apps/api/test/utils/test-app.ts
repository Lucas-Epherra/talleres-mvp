import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MembershipStatus, PrismaClient, WorkshopRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';

export const API_PREFIX = '/api/v1';

const TEST_PASSWORD = 'e2e-Password-123';

/**
 * Workshop created for a test run, with one logged-in member.
 */
export type TestWorkshop = {
  workshopId: string;
  userId: string;
  email: string;
  /** Supertest agent that keeps the httpOnly session cookie. */
  agent: ReturnType<typeof request.agent>;
};

/**
 * Boots the full API with the same HTTP pipeline as main.ts.
 */
export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>();

  configureApp(app);
  await app.init();

  return app;
}

/**
 * Creates an active workshop with one active member and logs it in through
 * the real login endpoint.
 *
 * Emails and slugs carry a random suffix so suites never collide with each
 * other or with leftovers from an aborted run.
 */
export async function createLoggedInWorkshop(
  app: INestApplication<App>,
  prisma: PrismaClient,
  label: string,
  role: WorkshopRole = WorkshopRole.OWNER,
): Promise<TestWorkshop> {
  const suffix = randomUUID().slice(0, 8);
  const email = `e2e-${label}-${suffix}@example.test`;

  const workshop = await prisma.workshop.create({
    data: {
      name: `Taller ${label} ${suffix}`,
      slug: `e2e-${label}-${suffix}`,
    },
  });

  const user = await prisma.user.create({
    data: {
      name: `Usuario ${label}`,
      email,
      passwordHash: await bcrypt.hash(TEST_PASSWORD, 4),
      memberships: {
        create: {
          workshopId: workshop.id,
          role,
          status: MembershipStatus.ACTIVE,
        },
      },
    },
  });

  const agent = request.agent(app.getHttpServer());

  await agent
    .post(`${API_PREFIX}/auth/login`)
    .send({ email, password: TEST_PASSWORD })
    .expect(200);

  return { workshopId: workshop.id, userId: user.id, email, agent };
}

/**
 * Removes everything created for the given workshops.
 *
 * Workshop rows cascade to all tenant data; users are removed afterwards.
 */
export async function deleteTestWorkshops(
  prisma: PrismaClient,
  workshops: TestWorkshop[],
): Promise<void> {
  await prisma.workshop.deleteMany({
    where: { id: { in: workshops.map((workshop) => workshop.workshopId) } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: workshops.map((workshop) => workshop.userId) } },
  });
}
