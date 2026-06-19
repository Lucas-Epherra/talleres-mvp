import 'dotenv/config';
import { PrismaClient, WorkOrderStatus, WorkshopRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const WORKSHOP_ID = '11111111-1111-4111-8111-111111111111';
const ADMIN_USER_ID = '22222222-2222-4222-8222-222222222222';

const OWNER_WORKSHOP_ID = '12121212-1212-4121-8121-121212121212';
const OWNER_USER_ID = '23232323-2323-4232-8232-232323232323';

const CUSTOMER_JUAN_PEREZ_ID = '33333333-3333-4333-8333-333333333333';
const CUSTOMER_MARIA_GONZALEZ_ID = '44444444-4444-4444-8444-444444444444';
const CUSTOMER_CARLOS_RAMIREZ_ID = '88888888-8888-4888-8888-888888888888';
const CUSTOMER_JUAN_PEDRO_ID = '99999999-9999-4999-8999-999999999999';
const CUSTOMER_LUCAS_EPHERRA_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const VEHICLE_GOL_TREND_ID = '55555555-5555-4555-8555-555555555555';
const VEHICLE_COROLLA_ID = '66666666-6666-4666-8666-666666666666';
const VEHICLE_FIESTA_ID = '77777777-7777-4777-8777-777777777777';
const VEHICLE_KANGOO_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const VEHICLE_HILUX_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const VEHICLE_307_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const VEHICLE_MAZDA_RX_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

const DEFAULT_DEMO_ADMIN_PASSWORD = 'Admin123!';
const DEFAULT_DEMO_OWNER_PASSWORD = 'test123!';

/**
 * Prevents destructive demo seeding from running accidentally in production.
 */
function assertSeedCanRun(): void {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_DESTRUCTIVE_SEED !== 'true'
  ) {
    throw new Error(
      'Refusing to run destructive demo seed in production without ALLOW_DESTRUCTIVE_SEED=true.',
    );
  }
}

/**
 * Reads the demo admin password from environment variables.
 */
function getDemoAdminPassword(): string {
  return process.env.DEMO_ADMIN_PASSWORD ?? DEFAULT_DEMO_ADMIN_PASSWORD;
}

/**
 * Reads the secondary demo owner password from environment variables.
 */
function getDemoOwnerPassword(): string {
  return process.env.DEMO_OWNER_PASSWORD ?? DEFAULT_DEMO_OWNER_PASSWORD;
}

/**
 * Creates deterministic demo data for local development and staging.
 *
 * This seed intentionally resets operational demo data only for the
 * `taller-demo` tenant before recreating customers, vehicles and work orders.
 * Auth, workshop and membership records are preserved through upserts.
 */
async function main(): Promise<void> {
  assertSeedCanRun();

  const demoAdminPassword = getDemoAdminPassword();
  const demoOwnerPassword = getDemoOwnerPassword();

  const [adminPasswordHash, ownerPasswordHash] = await Promise.all([
    bcrypt.hash(demoAdminPassword, 10),
    bcrypt.hash(demoOwnerPassword, 10),
  ]);

  const workshop = await prisma.workshop.upsert({
    where: {
      slug: 'taller-demo',
    },
    update: {
      name: 'Taller Demo',
    },
    create: {
      id: WORKSHOP_ID,
      name: 'Taller Demo',
      slug: 'taller-demo',
    },
  });

  const admin = await prisma.user.upsert({
    where: {
      email: 'admin@taller.demo',
    },
    update: {
      name: 'Admin Demo',
      passwordHash: adminPasswordHash,
    },
    create: {
      id: ADMIN_USER_ID,
      name: 'Admin Demo',
      email: 'admin@taller.demo',
      passwordHash: adminPasswordHash,
    },
  });

  await prisma.workshopMember.upsert({
    where: {
      workshopId_userId: {
        workshopId: workshop.id,
        userId: admin.id,
      },
    },
    update: {
      role: WorkshopRole.OWNER,
    },
    create: {
      workshopId: workshop.id,
      userId: admin.id,
      role: WorkshopRole.OWNER,
    },
  });

  const ownerWorkshop = await prisma.workshop.upsert({
    where: {
      slug: 'taller-dueno',
    },
    update: {
      name: 'Taller Dueño',
    },
    create: {
      id: OWNER_WORKSHOP_ID,
      name: 'Taller Dueño',
      slug: 'taller-dueno',
    },
  });

  const owner = await prisma.user.upsert({
    where: {
      email: 'dueno@taller.com',
    },
    update: {
      name: 'Dueño Taller',
      passwordHash: ownerPasswordHash,
    },
    create: {
      id: OWNER_USER_ID,
      name: 'Dueño Taller',
      email: 'dueno@taller.com',
      passwordHash: ownerPasswordHash,
    },
  });

  await prisma.workshopMember.upsert({
    where: {
      workshopId_userId: {
        workshopId: ownerWorkshop.id,
        userId: owner.id,
      },
    },
    update: {
      role: WorkshopRole.OWNER,
    },
    create: {
      workshopId: ownerWorkshop.id,
      userId: owner.id,
      role: WorkshopRole.OWNER,
    },
  });

  await resetOperationalDemoData(workshop.id);

  const customerJuanPerez = await prisma.customer.create({
    data: {
      id: CUSTOMER_JUAN_PEREZ_ID,
      workshopId: workshop.id,
      fullName: 'Juan Pérez',
      phone: '2983 123456',
      email: 'juan.perez@example.com',
      address: 'Av. San Martín 123',
      notes: 'Cliente frecuente. Prefiere contacto por WhatsApp.',
    },
  });

  const customerMariaGonzalez = await prisma.customer.create({
    data: {
      id: CUSTOMER_MARIA_GONZALEZ_ID,
      workshopId: workshop.id,
      fullName: 'María González',
      phone: '2983 654321',
      email: 'maria.gonzalez@example.com',
      address: 'Belgrano 850',
      notes: 'Solicita aviso antes de aprobar trabajos mayores.',
    },
  });

  const customerCarlosRamirez = await prisma.customer.create({
    data: {
      id: CUSTOMER_CARLOS_RAMIREZ_ID,
      workshopId: workshop.id,
      fullName: 'Carlos Ramírez',
      phone: '2983 777888',
      email: 'carlos.ramirez@example.com',
      address: 'Rivadavia 450',
      notes: 'Cliente nuevo.',
    },
  });

  const customerJuanPedro = await prisma.customer.create({
    data: {
      id: CUSTOMER_JUAN_PEDRO_ID,
      workshopId: workshop.id,
      fullName: 'Juan Pedro',
      phone: '2983 404022',
      email: 'jp@example.com',
      address: 'Belgrano 200',
      notes: 'Surfea una banda, todo el día en el agua.',
    },
  });

  const customerLucasEpherra = await prisma.customer.create({
    data: {
      id: CUSTOMER_LUCAS_EPHERRA_ID,
      workshopId: workshop.id,
      fullName: 'Lucas Epherra',
      phone: '02983 659649',
      email: 'lucas.epherra@example.com',
      address: 'Colón 135 8vo 1',
      notes:
        'Dueño del 307 bordo. Prefiere comunicación por WhatsApp. Cliente frecuente.',
    },
  });

  const vehicleGolTrend = await prisma.vehicle.create({
    data: {
      id: VEHICLE_GOL_TREND_ID,
      workshopId: workshop.id,
      customerId: customerJuanPerez.id,
      licensePlate: 'AA123BB',
      brand: 'Volkswagen',
      model: 'Gol Trend',
      year: 2017,
      mileage: 129200,
      notes: 'Vehículo de uso diario.',
    },
  });

  const vehicleCorolla = await prisma.vehicle.create({
    data: {
      id: VEHICLE_COROLLA_ID,
      workshopId: workshop.id,
      customerId: customerJuanPerez.id,
      licensePlate: 'AB456CD',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2015,
      mileage: 174000,
      notes: 'Revisar consumo de aceite en próximos servicios.',
    },
  });

  const vehicleFiesta = await prisma.vehicle.create({
    data: {
      id: VEHICLE_FIESTA_ID,
      workshopId: workshop.id,
      customerId: customerMariaGonzalez.id,
      licensePlate: 'AC789EF',
      brand: 'Ford',
      model: 'Fiesta',
      year: 2019,
      mileage: 89500,
      notes: 'Cliente reportó ruidos al frenar.',
    },
  });

  const vehicleKangoo = await prisma.vehicle.create({
    data: {
      id: VEHICLE_KANGOO_ID,
      workshopId: workshop.id,
      customerId: customerMariaGonzalez.id,
      licensePlate: 'AD999ZZ',
      brand: 'Renault',
      model: 'Kangoo',
      year: 2018,
      mileage: 142000,
      notes: 'Vehículo de trabajo.',
    },
  });

  const vehicleHilux = await prisma.vehicle.create({
    data: {
      id: VEHICLE_HILUX_ID,
      workshopId: workshop.id,
      customerId: customerJuanPerez.id,
      licensePlate: 'AD875L',
      brand: 'Toyota',
      model: 'Hilux',
      year: 2020,
      mileage: 135000,
      notes:
        'Tiene un rayón en la puerta delantera izquierda y un golpe en la puerta trasera derecha.',
    },
  });

  const vehicle307 = await prisma.vehicle.create({
    data: {
      id: VEHICLE_307_ID,
      workshopId: workshop.id,
      customerId: customerLucasEpherra.id,
      licensePlate: 'AB246S',
      brand: 'Peugeot',
      model: '307',
      year: 2009,
      mileage: 287000,
      notes:
        'Tiene el paragolpe delantero roto. No le funciona el motor del zorrino. Le ventea un inyector.',
    },
  });

  const vehicleMazdaRx = await prisma.vehicle.create({
    data: {
      id: VEHICLE_MAZDA_RX_ID,
      workshopId: workshop.id,
      customerId: customerJuanPedro.id,
      licensePlate: 'K264AS',
      brand: 'Mazda',
      model: 'RX',
      year: 2024,
      mileage: 60000,
      notes: 'Acelera mucho y casi lo fundió.',
    },
  });

  await prisma.workOrder.create({
    data: {
      workshopId: workshop.id,
      vehicleId: vehicleGolTrend.id,
      orderNumber: 1001,
      reportedIssue: 'El cliente reporta pérdida de potencia y tironeos.',
      diagnosis: 'Posible falla de encendido. Revisar bujías y bobina.',
      workDone: null,
      partsUsed: null,
      entryMileage: 128500,
      laborCost: 25000,
      partsCost: 0,
      estimatedTotal: 25000,
      finalTotal: null,
      status: WorkOrderStatus.IN_PROGRESS,
      entryDate: daysAgo(6),
      deliveryDate: null,
      notes: 'Prioridad media.',
    },
  });

  await prisma.workOrder.create({
    data: {
      workshopId: workshop.id,
      vehicleId: vehicleFiesta.id,
      orderNumber: 1002,
      reportedIssue: 'Ruido al frenar en tren delantero.',
      diagnosis: 'Pastillas delanteras gastadas.',
      workDone: 'Cambio de pastillas delanteras y limpieza de cálipers.',
      partsUsed: 'Juego de pastillas delanteras.',
      entryMileage: 89500,
      laborCost: 18000,
      partsCost: 42000,
      estimatedTotal: 60000,
      finalTotal: 60000,
      status: WorkOrderStatus.READY,
      entryDate: daysAgo(5),
      deliveryDate: null,
      notes: 'Listo para entregar.',
    },
  });

  await prisma.workOrder.create({
    data: {
      workshopId: workshop.id,
      vehicleId: vehicleCorolla.id,
      orderNumber: 1003,
      reportedIssue: 'Service periódico.',
      diagnosis: 'Mantenimiento preventivo.',
      workDone: 'Cambio de aceite, filtros y revisión general.',
      partsUsed: 'Aceite 10W40, filtro de aceite, filtro de aire.',
      entryMileage: 174000,
      laborCost: 22000,
      partsCost: 58000,
      estimatedTotal: 80000,
      finalTotal: 80000,
      status: WorkOrderStatus.DELIVERED,
      entryDate: daysAgo(4),
      deliveryDate: daysAgo(3),
      notes: 'Trabajo entregado sin observaciones.',
    },
  });

  await prisma.workOrder.create({
    data: {
      workshopId: workshop.id,
      vehicleId: vehicleGolTrend.id,
      orderNumber: 1004,
      reportedIssue: 'Control general previo a viaje.',
      diagnosis: null,
      workDone: null,
      partsUsed: null,
      entryMileage: 129200,
      laborCost: null,
      partsCost: null,
      estimatedTotal: null,
      finalTotal: null,
      status: WorkOrderStatus.PENDING,
      entryDate: daysAgo(3),
      deliveryDate: null,
      notes: 'Revisar frenos, fluidos, luces y cubiertas.',
    },
  });

  await prisma.workOrder.create({
    data: {
      workshopId: workshop.id,
      vehicleId: vehicleKangoo.id,
      orderNumber: 1005,
      reportedIssue: 'Cliente reporta vibración en ruta a más de 90 km/h.',
      diagnosis: 'Pendiente de revisión.',
      workDone: null,
      partsUsed: null,
      entryMileage: 130100,
      laborCost: null,
      partsCost: null,
      estimatedTotal: 45000,
      finalTotal: null,
      status: WorkOrderStatus.READY,
      entryDate: daysAgo(2),
      deliveryDate: null,
      notes: 'Revisar balanceo, tren delantero y cubiertas.',
    },
  });

  await prisma.workOrder.create({
    data: {
      workshopId: workshop.id,
      vehicleId: vehicle307.id,
      orderNumber: 1006,
      reportedIssue: 'El cliente reporta falla al arrancar.',
      diagnosis: 'El burro de arranque no funcionaba.',
      workDone: 'Se realizó un cambio de burro.',
      partsUsed: 'Burro de arranque nuevo.',
      entryMileage: 287000,
      laborCost: 70000,
      partsCost: 55000,
      estimatedTotal: 120000,
      finalTotal: 125000,
      status: WorkOrderStatus.DELIVERED,
      entryDate: daysAgo(1),
      deliveryDate: daysAgo(1),
      notes:
        'El repuesto fue un poco más caro, pero no se escapó del presupuesto inicial.',
    },
  });

  await prisma.workOrder.create({
    data: {
      workshopId: workshop.id,
      vehicleId: vehicleMazdaRx.id,
      orderNumber: 1007,
      reportedIssue: 'El cliente reporta que le humea el motor.',
      diagnosis: null,
      workDone: null,
      partsUsed: null,
      entryMileage: 60000,
      laborCost: 90000,
      partsCost: null,
      estimatedTotal: 150000,
      finalTotal: null,
      status: WorkOrderStatus.PENDING,
      entryDate: new Date(),
      deliveryDate: null,
      notes: 'Vamos a revisar el vehículo.',
    },
  });

  const [customersCount, vehiclesCount, workOrdersCount] = await Promise.all([
    prisma.customer.count({
      where: {
        workshopId: workshop.id,
      },
    }),
    prisma.vehicle.count({
      where: {
        workshopId: workshop.id,
      },
    }),
    prisma.workOrder.count({
      where: {
        workshopId: workshop.id,
      },
    }),
  ]);

  const [ownerCustomersCount, ownerVehiclesCount, ownerWorkOrdersCount] =
    await Promise.all([
      prisma.customer.count({
        where: {
          workshopId: ownerWorkshop.id,
        },
      }),
      prisma.vehicle.count({
        where: {
          workshopId: ownerWorkshop.id,
        },
      }),
      prisma.workOrder.count({
        where: {
          workshopId: ownerWorkshop.id,
        },
      }),
    ]);

  console.log('Seed completed successfully.');
  console.log('Demo summary:');
  console.log(`Workshop: ${workshop.name}`);
  console.log(`Customers: ${customersCount}`);
  console.log(`Vehicles: ${vehiclesCount}`);
  console.log(`Work orders: ${workOrdersCount}`);
  console.log('Demo credentials:');
  console.log('Email: admin@taller.demo');
  console.log(
    `Password: ${
      process.env.DEMO_ADMIN_PASSWORD ? '[from DEMO_ADMIN_PASSWORD]' : '[local default]'
    }`,
  );
  console.log('Secondary workshop summary:');
  console.log(`Workshop: ${ownerWorkshop.name}`);
  console.log(`Customers: ${ownerCustomersCount}`);
  console.log(`Vehicles: ${ownerVehiclesCount}`);
  console.log(`Work orders: ${ownerWorkOrdersCount}`);
  console.log('Secondary workshop credentials:');
  console.log('Email: dueno@taller.com');
  console.log(
    `Password: ${
      process.env.DEMO_OWNER_PASSWORD ? '[from DEMO_OWNER_PASSWORD]' : '[local default]'
    }`,
  );
}

/**
 * Deletes operational records for the demo workshop.
 *
 * Auth, workshop and membership records are preserved. Customers, vehicles and
 * work orders are recreated from scratch to avoid stale corrupted demo data.
 */
async function resetOperationalDemoData(workshopId: string): Promise<void> {
  await prisma.workOrder.deleteMany({
    where: {
      workshopId,
    },
  });

  await prisma.vehicle.deleteMany({
    where: {
      workshopId,
    },
  });

  await prisma.customer.deleteMany({
    where: {
      workshopId,
    },
  });
}

/**
 * Returns a Date object relative to the current day.
 */
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return date;
}

main()
  .catch((error) => {
    console.error('Seed failed.');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });