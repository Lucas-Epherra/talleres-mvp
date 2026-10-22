import {
  ExecutionContext,
  INestApplication,
  Provider,
  Type,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PlatformRole, UserStatus, WorkshopRole } from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';
import { SuppliersController } from '../../suppliers/suppliers.controller';
import { SuppliersService } from '../../suppliers/suppliers.service';
import { WorkOrdersController } from '../../work-orders/work-orders.controller';
import { WorkOrdersService } from '../../work-orders/work-orders.service';
import { WorkshopSettingsController } from '../../workshop-settings/workshop-settings.controller';
import { WorkshopSettingsService } from '../../workshop-settings/workshop-settings.service';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

type RouteCase = {
  method: HttpMethod;
  path: string;
};

/**
 * Builds a service mock whose methods resolve to an empty object.
 */
function buildServiceMock(methods: string[]): Record<string, jest.Mock> {
  return Object.fromEntries(
    methods.map((method) => [method, jest.fn().mockResolvedValue({})]),
  );
}

/**
 * Boots a controller over HTTP with AuthGuard replaced by a stub that attaches
 * a user with the given role, so RolesGuard runs exactly as in production.
 */
async function createApp(
  controller: Type<unknown>,
  service: Provider,
  workshopRole: WorkshopRole,
): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({
    controllers: [controller],
    providers: [service, RolesGuard],
  })
    .overrideGuard(AuthGuard)
    .useValue({
      canActivate: (context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

        req.user = {
          id: 'user-1',
          email: 'user@taller.test',
          name: 'Usuario',
          platformRole: PlatformRole.NONE,
          status: UserStatus.ACTIVE,
          workshopId: 'workshop-1',
          workshopRole,
          role: workshopRole,
        };

        return true;
      },
    })
    .compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>();
  await app.init();

  return app;
}

const suites: {
  name: string;
  controller: Type<unknown>;
  service: Provider;
  restricted: RouteCase[];
  open: RouteCase[];
}[] = [
  {
    name: 'WorkshopSettingsController',
    controller: WorkshopSettingsController,
    service: {
      provide: WorkshopSettingsService,
      useValue: buildServiceMock([
        'getSettings',
        'updateSettings',
        'uploadLogo',
        'deleteLogo',
      ]),
    },
    restricted: [
      { method: 'patch', path: '/workshop/settings' },
      { method: 'delete', path: '/workshop/settings/logo' },
    ],
    open: [{ method: 'get', path: '/workshop/settings' }],
  },
  {
    name: 'SuppliersController',
    controller: SuppliersController,
    service: {
      provide: SuppliersService,
      useValue: buildServiceMock([
        'findPayments',
        'createPayment',
        'updatePayment',
        'voidPayment',
        'findAll',
        'create',
      ]),
    },
    restricted: [
      { method: 'post', path: '/suppliers/s-1/payments' },
      { method: 'patch', path: '/suppliers/s-1/payments/p-1' },
      { method: 'patch', path: '/suppliers/s-1/payments/p-1/void' },
    ],
    open: [
      { method: 'get', path: '/suppliers/s-1/payments' },
      { method: 'get', path: '/suppliers' },
      { method: 'post', path: '/suppliers' },
    ],
  },
  {
    name: 'WorkOrdersController',
    controller: WorkOrdersController,
    service: {
      provide: WorkOrdersService,
      useValue: buildServiceMock([
        'findAll',
        'update',
        'updateStatus',
        'reopen',
        'cancel',
      ]),
    },
    restricted: [
      { method: 'patch', path: '/work-orders/wo-1/reopen' },
      { method: 'patch', path: '/work-orders/wo-1/cancel' },
    ],
    open: [
      { method: 'get', path: '/work-orders' },
      { method: 'patch', path: '/work-orders/wo-1' },
      { method: 'patch', path: '/work-orders/wo-1/status' },
    ],
  },
];

describe.each(suites)(
  '$name role enforcement',
  ({ controller, service, restricted, open }) => {
    const apps = new Map<WorkshopRole, INestApplication<App>>();

    beforeAll(async () => {
      for (const role of Object.values(WorkshopRole)) {
        apps.set(role, await createApp(controller, service, role));
      }
    });

    afterAll(async () => {
      for (const app of apps.values()) {
        await app.close();
      }
    });

    const call = (role: WorkshopRole, { method, path }: RouteCase) =>
      request(apps.get(role)!.getHttpServer())[method](path).send({});

    it.each(restricted)('rejects OPERATOR on $method $path', async (route) => {
      await call(WorkshopRole.OPERATOR, route).expect(403);
    });

    it.each(restricted)(
      'allows OWNER and ADMIN on $method $path',
      async (route) => {
        for (const role of [WorkshopRole.OWNER, WorkshopRole.ADMIN]) {
          const response = await call(role, route);

          expect(response.status).toBeLessThan(400);
        }
      },
    );

    it.each(open)('keeps $method $path open to OPERATOR', async (route) => {
      const response = await call(WorkshopRole.OPERATOR, route);

      expect(response.status).toBeLessThan(400);
    });
  },
);

describe('WorkshopSettingsController logo upload', () => {
  it('rejects OPERATOR before parsing the upload', async () => {
    const app = await createApp(
      WorkshopSettingsController,
      {
        provide: WorkshopSettingsService,
        useValue: buildServiceMock(['uploadLogo']),
      },
      WorkshopRole.OPERATOR,
    );

    await request(app.getHttpServer())
      .post('/workshop/settings/logo')
      .expect(403);

    await app.close();
  });

  it('lets ADMIN reach the handler', async () => {
    const app = await createApp(
      WorkshopSettingsController,
      {
        provide: WorkshopSettingsService,
        useValue: buildServiceMock(['uploadLogo']),
      },
      WorkshopRole.ADMIN,
    );

    // No file attached: the handler answers 400, proving the guard let it through.
    await request(app.getHttpServer())
      .post('/workshop/settings/logo')
      .expect(400);

    await app.close();
  });
});
