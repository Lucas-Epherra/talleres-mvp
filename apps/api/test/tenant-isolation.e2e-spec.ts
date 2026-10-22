import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { PrismaClient, WorkOrderStatus } from '@prisma/client';
import {
  API_PREFIX,
  createLoggedInWorkshop,
  createTestApp,
  deleteTestWorkshops,
  type TestWorkshop,
} from './utils/test-app';

/**
 * Ids of the records workshop B owns. Workshop A must never read or change them.
 */
type ForeignIds = {
  customerId: string;
  vehicleId: string;
  workOrderId: string;
  appointmentId: string;
  supplierId: string;
  categoryId: string;
  partId: string;
  paymentId: string;
  receiptId: string;
};

type IdResponse = { id: string };

/**
 * Multi-tenant isolation: a logged-in member of workshop A targets every
 * record of workshop B by id. Each attempt must fail as "not found" (the API
 * never confirms that a foreign id exists) and B's data must stay untouched.
 */
describe('Tenant isolation (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let workshopA: TestWorkshop;
  let workshopB: TestWorkshop;
  let foreign: ForeignIds;

  const url = (path: string): string => `${API_PREFIX}${path}`;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = new PrismaClient();

    workshopA = await createLoggedInWorkshop(app, prisma, 'a');
    workshopB = await createLoggedInWorkshop(app, prisma, 'b');
    foreign = await seedWorkshopData(workshopB);
  });

  afterAll(async () => {
    await deleteTestWorkshops(prisma, [workshopA, workshopB].filter(Boolean));
    await prisma.$disconnect();
    await app.close();
  });

  /**
   * Creates one record of every tenant-owned resource through B's own session,
   * so the data goes through the same validation as real usage.
   */
  async function seedWorkshopData(owner: TestWorkshop): Promise<ForeignIds> {
    const { agent } = owner;

    const customer = await agent
      .post(url('/customers'))
      .send({ fullName: 'Cliente de B', phone: '+54 11 5555-0001' })
      .expect(201);
    const customerId = (customer.body as IdResponse).id;

    const vehicle = await agent
      .post(url('/vehicles'))
      .send({
        customerId,
        licensePlate: 'BBB 123',
        brand: 'Fiat',
        model: 'Uno',
      })
      .expect(201);
    const vehicleId = (vehicle.body as IdResponse).id;

    const workOrder = await agent
      .post(url('/work-orders'))
      .send({ vehicleId, reportedIssue: 'Ruido en el tren delantero' })
      .expect(201);
    const workOrderId = (workOrder.body as IdResponse).id;

    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const appointment = await agent
      .post(url('/appointments'))
      .send({
        title: 'Turno de B',
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
        customerId,
        vehicleId,
      })
      .expect(201);
    const appointmentId = (appointment.body as IdResponse).id;

    const supplier = await agent
      .post(url('/suppliers'))
      .send({ name: 'Proveedor de B' })
      .expect(201);
    const supplierId = (supplier.body as IdResponse).id;

    const category = await agent
      .post(url('/suppliers/categories'))
      .send({ name: 'Frenos B' })
      .expect(201);
    const categoryId = (category.body as IdResponse).id;

    const part = await agent
      .post(url(`/suppliers/${supplierId}/parts`))
      .send({ name: 'Pastilla de freno', currentCost: 1000 })
      .expect(201);
    const partId = (part.body as IdResponse).id;

    const payment = await agent
      .post(url(`/suppliers/${supplierId}/payments`))
      .send({ amount: 500 })
      .expect(201);
    const paymentId = (payment.body as IdResponse).id;

    const receipt = await agent
      .post(url(`/receipts/work-orders/${workOrderId}`))
      .send({})
      .expect(201);
    const receiptId = (receipt.body as IdResponse).id;

    return {
      customerId,
      vehicleId,
      workOrderId,
      appointmentId,
      supplierId,
      categoryId,
      partId,
      paymentId,
      receiptId,
    };
  }

  /**
   * Asserts a list response from A does not mention any of B's ids.
   */
  async function expectListWithoutForeignIds(path: string): Promise<void> {
    const response = await workshopA.agent.get(url(path)).expect(200);
    const serialized = JSON.stringify(response.body);

    for (const id of Object.values(foreign)) {
      expect(serialized).not.toContain(id);
    }
  }

  describe('customers', () => {
    it('does not list or read another workshop customer', async () => {
      await expectListWithoutForeignIds('/customers');
      await workshopA.agent
        .get(url(`/customers/${foreign.customerId}`))
        .expect(404);
    });

    it('does not update, archive or restore another workshop customer', async () => {
      await workshopA.agent
        .patch(url(`/customers/${foreign.customerId}`))
        .send({ fullName: 'Hackeado' })
        .expect(404);
      await workshopA.agent
        .patch(url(`/customers/${foreign.customerId}/archive`))
        .send({ reason: 'Intento cruzado' })
        .expect(404);
      await workshopA.agent
        .patch(url(`/customers/${foreign.customerId}/restore`))
        .send({ reason: 'Intento cruzado' })
        .expect(404);
    });
  });

  describe('vehicles', () => {
    it('does not list or read another workshop vehicle', async () => {
      await expectListWithoutForeignIds('/vehicles');
      await workshopA.agent
        .get(url(`/vehicles/${foreign.vehicleId}`))
        .expect(404);
      await workshopA.agent
        .get(url(`/vehicles/${foreign.vehicleId}/profile`))
        .expect(404);
    });

    it('does not update, archive or restore another workshop vehicle', async () => {
      await workshopA.agent
        .patch(url(`/vehicles/${foreign.vehicleId}`))
        .send({ brand: 'Hackeado' })
        .expect(404);
      await workshopA.agent
        .patch(url(`/vehicles/${foreign.vehicleId}/archive`))
        .send({ reason: 'Intento cruzado' })
        .expect(404);
      await workshopA.agent
        .patch(url(`/vehicles/${foreign.vehicleId}/restore`))
        .send({ reason: 'Intento cruzado' })
        .expect(404);
    });

    it('does not attach a vehicle to another workshop customer', async () => {
      await workshopA.agent
        .post(url('/vehicles'))
        .send({
          customerId: foreign.customerId,
          licensePlate: 'AAA 999',
          brand: 'Ford',
          model: 'Ka',
        })
        .expect(404);
    });
  });

  describe('work orders', () => {
    it('does not list or read another workshop work order', async () => {
      await expectListWithoutForeignIds('/work-orders');
      await workshopA.agent
        .get(url(`/work-orders/${foreign.workOrderId}`))
        .expect(404);
    });

    it('does not change another workshop work order', async () => {
      await workshopA.agent
        .patch(url(`/work-orders/${foreign.workOrderId}`))
        .send({ diagnosis: 'Hackeado' })
        .expect(404);
      await workshopA.agent
        .patch(url(`/work-orders/${foreign.workOrderId}/status`))
        .send({ status: WorkOrderStatus.IN_PROGRESS })
        .expect(404);
      await workshopA.agent
        .patch(url(`/work-orders/${foreign.workOrderId}/cancel`))
        .send({ reason: 'Intento cruzado' })
        .expect(404);
      await workshopA.agent
        .patch(url(`/work-orders/${foreign.workOrderId}/reopen`))
        .send({ reason: 'Intento cruzado' })
        .expect(404);
    });

    it('does not open a work order on another workshop vehicle', async () => {
      await workshopA.agent
        .post(url('/work-orders'))
        .send({
          vehicleId: foreign.vehicleId,
          reportedIssue: 'Intento cruzado',
        })
        .expect(404);
    });
  });

  describe('appointments', () => {
    it('does not list or read another workshop appointment', async () => {
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await expectListWithoutForeignIds('/appointments');
      await expectListWithoutForeignIds(
        `/appointments/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      );
      await workshopA.agent
        .get(url(`/appointments/${foreign.appointmentId}`))
        .expect(404);
    });

    it('does not change another workshop appointment', async () => {
      await workshopA.agent
        .patch(url(`/appointments/${foreign.appointmentId}`))
        .send({ title: 'Hackeado' })
        .expect(404);
      await workshopA.agent
        .patch(url(`/appointments/${foreign.appointmentId}/confirm`))
        .send({})
        .expect(404);
      await workshopA.agent
        .patch(url(`/appointments/${foreign.appointmentId}/complete`))
        .send({})
        .expect(404);
      await workshopA.agent
        .patch(url(`/appointments/${foreign.appointmentId}/cancel`))
        .send({ reason: 'Intento cruzado' })
        .expect(404);
    });

    it('does not link an appointment to another workshop records', async () => {
      const start = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const base = {
        title: 'Turno cruzado',
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
      };

      for (const link of [
        { customerId: foreign.customerId },
        { vehicleId: foreign.vehicleId },
        { workOrderId: foreign.workOrderId },
      ]) {
        await workshopA.agent
          .post(url('/appointments'))
          .send({ ...base, ...link })
          .expect(404);
      }
    });
  });

  describe('receipts', () => {
    it('does not list, read or download another workshop receipt', async () => {
      await expectListWithoutForeignIds('/receipts');
      await workshopA.agent
        .get(url(`/receipts/${foreign.receiptId}`))
        .expect(404);
      await workshopA.agent
        .get(url(`/receipts/${foreign.receiptId}/pdf`))
        .expect(404);
    });

    it('does not issue or email receipts for another workshop', async () => {
      await workshopA.agent
        .post(url(`/receipts/work-orders/${foreign.workOrderId}`))
        .send({})
        .expect(404);
      await workshopA.agent
        .post(url(`/receipts/${foreign.receiptId}/send-email`))
        .send({ to: 'atacante@example.test' })
        .expect(404);
    });
  });

  describe('suppliers', () => {
    it('does not list or read another workshop supplier data', async () => {
      await expectListWithoutForeignIds('/suppliers');
      await expectListWithoutForeignIds('/suppliers/categories');
      await workshopA.agent
        .get(url(`/suppliers/${foreign.supplierId}`))
        .expect(404);
      await workshopA.agent
        .get(url(`/suppliers/${foreign.supplierId}/parts`))
        .expect(404);
      await workshopA.agent
        .get(url(`/suppliers/${foreign.supplierId}/payments`))
        .expect(404);
    });

    it('does not change another workshop supplier', async () => {
      await workshopA.agent
        .patch(url(`/suppliers/${foreign.supplierId}`))
        .send({ name: 'Hackeado' })
        .expect(404);
      await workshopA.agent
        .patch(url(`/suppliers/${foreign.supplierId}/archive`))
        .send({ reason: 'Intento cruzado' })
        .expect(404);
      await workshopA.agent
        .patch(url(`/suppliers/${foreign.supplierId}/restore`))
        .send({ reason: 'Intento cruzado' })
        .expect(404);
    });

    it('does not change another workshop parts', async () => {
      const partUrl = `/suppliers/${foreign.supplierId}/parts/${foreign.partId}`;

      await workshopA.agent
        .post(url(`/suppliers/${foreign.supplierId}/parts`))
        .send({ name: 'Repuesto cruzado', currentCost: 1 })
        .expect(404);
      await workshopA.agent
        .patch(url(partUrl))
        .send({ name: 'Hackeado' })
        .expect(404);
      await workshopA.agent
        .patch(url(`${partUrl}/archive`))
        .send({ reason: 'Intento cruzado' })
        .expect(404);
      await workshopA.agent
        .patch(url(`${partUrl}/restore`))
        .send({ reason: 'Intento cruzado' })
        .expect(404);
    });

    it('does not change another workshop payments', async () => {
      const paymentUrl = `/suppliers/${foreign.supplierId}/payments/${foreign.paymentId}`;

      await workshopA.agent
        .post(url(`/suppliers/${foreign.supplierId}/payments`))
        .send({ amount: 1 })
        .expect(404);
      await workshopA.agent
        .patch(url(paymentUrl))
        .send({ amount: 1 })
        .expect(404);
      await workshopA.agent
        .patch(url(`${paymentUrl}/void`))
        .send({ reason: 'Intento cruzado' })
        .expect(404);
    });

    it('does not use another workshop category or part in own records', async () => {
      const ownSupplier = await workshopA.agent
        .post(url('/suppliers'))
        .send({ name: 'Proveedor de A' })
        .expect(201);
      const ownSupplierId = (ownSupplier.body as IdResponse).id;

      await workshopA.agent
        .post(url(`/suppliers/${ownSupplierId}/parts`))
        .send({
          name: 'Repuesto con categoría ajena',
          currentCost: 1,
          categoryId: foreign.categoryId,
        })
        .expect(404);

      // A's own path but B's part id: the part must not be found under A.
      await workshopA.agent
        .patch(url(`/suppliers/${ownSupplierId}/parts/${foreign.partId}`))
        .send({ name: 'Hackeado' })
        .expect(404);
    });
  });

  describe('workshop scope', () => {
    it('ignores a workshopId sent by the client', async () => {
      await workshopA.agent
        .post(url('/customers'))
        .send({
          fullName: 'Cliente inyectado',
          phone: '+54 11 5555-0002',
          workshopId: workshopB.workshopId,
        })
        .expect(400);
    });

    it('only shows the own workshop settings', async () => {
      const response = await workshopA.agent
        .get(url('/workshop/settings'))
        .expect(200);

      expect(JSON.stringify(response.body)).not.toContain(workshopB.workshopId);
    });

    it('does not expose platform administration to workshop members', async () => {
      await workshopA.agent.get(url('/platform/workshops')).expect(403);
    });
  });

  it('leaves workshop B data untouched after every cross-tenant attempt', async () => {
    const [customer, vehicle, workOrder, appointment, supplier, part, payment] =
      await Promise.all([
        prisma.customer.findUniqueOrThrow({
          where: { id: foreign.customerId },
        }),
        prisma.vehicle.findUniqueOrThrow({ where: { id: foreign.vehicleId } }),
        prisma.workOrder.findUniqueOrThrow({
          where: { id: foreign.workOrderId },
        }),
        prisma.appointment.findUniqueOrThrow({
          where: { id: foreign.appointmentId },
        }),
        prisma.supplier.findUniqueOrThrow({
          where: { id: foreign.supplierId },
        }),
        prisma.supplierPart.findUniqueOrThrow({
          where: { id: foreign.partId },
        }),
        prisma.supplierPayment.findUniqueOrThrow({
          where: { id: foreign.paymentId },
        }),
      ]);

    expect(customer).toMatchObject({
      fullName: 'Cliente de B',
      archivedAt: null,
    });
    expect(vehicle).toMatchObject({ brand: 'Fiat', archivedAt: null });
    expect(workOrder).toMatchObject({
      status: WorkOrderStatus.PENDING,
      diagnosis: null,
    });
    expect(appointment.title).toBe('Turno de B');
    expect(supplier).toMatchObject({
      name: 'Proveedor de B',
      archivedAt: null,
    });
    expect(part).toMatchObject({ name: 'Pastilla de freno', archivedAt: null });
    expect(payment.voidedAt).toBeNull();
    expect(Number(payment.amount)).toBe(500);

    const customersInA = await prisma.customer.count({
      where: { workshopId: workshopA.workshopId },
    });
    const partsUnderForeignSupplier = await prisma.supplierPart.count({
      where: { supplierId: foreign.supplierId },
    });
    const paymentsUnderForeignSupplier = await prisma.supplierPayment.count({
      where: { supplierId: foreign.supplierId },
    });

    expect(customersInA).toBe(0);
    expect(partsUnderForeignSupplier).toBe(1);
    expect(paymentsUnderForeignSupplier).toBe(1);
  });
});
