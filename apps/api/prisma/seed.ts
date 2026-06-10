import 'dotenv/config';
import { PrismaClient, WorkOrderStatus, WorkshopRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const WORKSHOP_ID = '11111111-1111-4111-8111-111111111111';
const ADMIN_USER_ID = '22222222-2222-4222-8222-222222222222';

const CUSTOMER_ONE_ID = '33333333-3333-4333-8333-333333333333';
const CUSTOMER_TWO_ID = '44444444-4444-4444-8444-444444444444';

const VEHICLE_ONE_ID = '55555555-5555-4555-8555-555555555555';
const VEHICLE_TWO_ID = '66666666-6666-4666-8666-666666666666';
const VEHICLE_THREE_ID = '77777777-7777-4777-8777-777777777777';

/**
 * Creates deterministic demo data for local development.
 *
 * The seed is intentionally idempotent: running it multiple times updates
 * existing records instead of duplicating core demo entities.
 */
async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('Admin123!', 10);

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
      passwordHash,
    },
    create: {
      id: ADMIN_USER_ID,
      name: 'Admin Demo',
      email: 'admin@taller.demo',
      passwordHash,
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

  const customerOne = await prisma.customer.upsert({
    where: {
      id: CUSTOMER_ONE_ID,
    },
    update: {
      fullName: 'Juan Pérez',
      phone: '2983 123456',
      email: 'juan.perez@example.com',
      address: 'Av. San Martín 123',
      notes: 'Cliente frecuente. Prefiere contacto por WhatsApp.',
    },
    create: {
      id: CUSTOMER_ONE_ID,
      workshopId: workshop.id,
      fullName: 'Juan Pérez',
      phone: '2983 123456',
      email: 'juan.perez@example.com',
      address: 'Av. San Martín 123',
      notes: 'Cliente frecuente. Prefiere contacto por WhatsApp.',
    },
  });

  const customerTwo = await prisma.customer.upsert({
    where: {
      id: CUSTOMER_TWO_ID,
    },
    update: {
      fullName: 'María González',
      phone: '2983 654321',
      email: 'maria.gonzalez@example.com',
      address: 'Belgrano 850',
      notes: 'Solicita aviso antes de aprobar trabajos mayores.',
    },
    create: {
      id: CUSTOMER_TWO_ID,
      workshopId: workshop.id,
      fullName: 'María González',
      phone: '2983 654321',
      email: 'maria.gonzalez@example.com',
      address: 'Belgrano 850',
      notes: 'Solicita aviso antes de aprobar trabajos mayores.',
    },
  });

  const vehicleOne = await prisma.vehicle.upsert({
    where: {
      id: VEHICLE_ONE_ID,
    },
    update: {
      customerId: customerOne.id,
      licensePlate: 'AA123BB',
      brand: 'Volkswagen',
      model: 'Gol Trend',
      year: 2017,
      mileage: 128500,
      notes: 'Vehículo de uso diario.',
    },
    create: {
      id: VEHICLE_ONE_ID,
      workshopId: workshop.id,
      customerId: customerOne.id,
      licensePlate: 'AA123BB',
      brand: 'Volkswagen',
      model: 'Gol Trend',
      year: 2017,
      mileage: 128500,
      notes: 'Vehículo de uso diario.',
    },
  });

  const vehicleTwo = await prisma.vehicle.upsert({
    where: {
      id: VEHICLE_TWO_ID,
    },
    update: {
      customerId: customerOne.id,
      licensePlate: 'AB456CD',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2015,
      mileage: 174000,
      notes: 'Revisar consumo de aceite en próximos servicios.',
    },
    create: {
      id: VEHICLE_TWO_ID,
      workshopId: workshop.id,
      customerId: customerOne.id,
      licensePlate: 'AB456CD',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2015,
      mileage: 174000,
      notes: 'Revisar consumo de aceite en próximos servicios.',
    },
  });

  const vehicleThree = await prisma.vehicle.upsert({
    where: {
      id: VEHICLE_THREE_ID,
    },
    update: {
      customerId: customerTwo.id,
      licensePlate: 'AC789EF',
      brand: 'Ford',
      model: 'Fiesta',
      year: 2019,
      mileage: 89500,
      notes: 'Cliente reportó ruidos al frenar.',
    },
    create: {
      id: VEHICLE_THREE_ID,
      workshopId: workshop.id,
      customerId: customerTwo.id,
      licensePlate: 'AC789EF',
      brand: 'Ford',
      model: 'Fiesta',
      year: 2019,
      mileage: 89500,
      notes: 'Cliente reportó ruidos al frenar.',
    },
  });

  await prisma.workOrder.upsert({
    where: {
      workshopId_orderNumber: {
        workshopId: workshop.id,
        orderNumber: 1001,
      },
    },
    update: {
      vehicleId: vehicleOne.id,
      reportedIssue: 'El cliente reporta pérdida de potencia y tironeos.',
      diagnosis: 'Posible falla de encendido. Revisar bujías y bobina.',
      workDone: null,
      partsUsed: null,
      laborCost: 25000,
      partsCost: 0,
      estimatedTotal: 25000,
      finalTotal: null,
      status: WorkOrderStatus.IN_PROGRESS,
      notes: 'Prioridad media.',
    },
    create: {
      workshopId: workshop.id,
      vehicleId: vehicleOne.id,
      orderNumber: 1001,
      reportedIssue: 'El cliente reporta pérdida de potencia y tironeos.',
      diagnosis: 'Posible falla de encendido. Revisar bujías y bobina.',
      laborCost: 25000,
      partsCost: 0,
      estimatedTotal: 25000,
      status: WorkOrderStatus.IN_PROGRESS,
      notes: 'Prioridad media.',
    },
  });

  await prisma.workOrder.upsert({
    where: {
      workshopId_orderNumber: {
        workshopId: workshop.id,
        orderNumber: 1002,
      },
    },
    update: {
      vehicleId: vehicleThree.id,
      reportedIssue: 'Ruido al frenar en tren delantero.',
      diagnosis: 'Pastillas delanteras gastadas.',
      workDone: 'Cambio de pastillas delanteras y limpieza de cálipers.',
      partsUsed: 'Juego de pastillas delanteras.',
      laborCost: 18000,
      partsCost: 42000,
      estimatedTotal: 60000,
      finalTotal: 60000,
      status: WorkOrderStatus.READY,
      notes: 'Listo para entregar.',
    },
    create: {
      workshopId: workshop.id,
      vehicleId: vehicleThree.id,
      orderNumber: 1002,
      reportedIssue: 'Ruido al frenar en tren delantero.',
      diagnosis: 'Pastillas delanteras gastadas.',
      workDone: 'Cambio de pastillas delanteras y limpieza de cálipers.',
      partsUsed: 'Juego de pastillas delanteras.',
      laborCost: 18000,
      partsCost: 42000,
      estimatedTotal: 60000,
      finalTotal: 60000,
      status: WorkOrderStatus.READY,
      notes: 'Listo para entregar.',
    },
  });

  await prisma.workOrder.upsert({
    where: {
      workshopId_orderNumber: {
        workshopId: workshop.id,
        orderNumber: 1003,
      },
    },
    update: {
      vehicleId: vehicleTwo.id,
      reportedIssue: 'Service periódico.',
      diagnosis: 'Mantenimiento preventivo.',
      workDone: 'Cambio de aceite, filtros y revisión general.',
      partsUsed: 'Aceite 10W40, filtro de aceite, filtro de aire.',
      laborCost: 22000,
      partsCost: 58000,
      estimatedTotal: 80000,
      finalTotal: 80000,
      status: WorkOrderStatus.DELIVERED,
      notes: 'Trabajo entregado sin observaciones.',
    },
    create: {
      workshopId: workshop.id,
      vehicleId: vehicleTwo.id,
      orderNumber: 1003,
      reportedIssue: 'Service periódico.',
      diagnosis: 'Mantenimiento preventivo.',
      workDone: 'Cambio de aceite, filtros y revisión general.',
      partsUsed: 'Aceite 10W40, filtro de aceite, filtro de aire.',
      laborCost: 22000,
      partsCost: 58000,
      estimatedTotal: 80000,
      finalTotal: 80000,
      status: WorkOrderStatus.DELIVERED,
      notes: 'Trabajo entregado sin observaciones.',
    },
  });

  await prisma.workOrder.upsert({
    where: {
      workshopId_orderNumber: {
        workshopId: workshop.id,
        orderNumber: 1004,
      },
    },
    update: {
      vehicleId: vehicleOne.id,
      reportedIssue: 'Control general previo a viaje.',
      diagnosis: null,
      workDone: null,
      partsUsed: null,
      laborCost: null,
      partsCost: null,
      estimatedTotal: null,
      finalTotal: null,
      status: WorkOrderStatus.PENDING,
      notes: 'Revisar frenos, fluidos, luces y cubiertas.',
    },
    create: {
      workshopId: workshop.id,
      vehicleId: vehicleOne.id,
      orderNumber: 1004,
      reportedIssue: 'Control general previo a viaje.',
      status: WorkOrderStatus.PENDING,
      notes: 'Revisar frenos, fluidos, luces y cubiertas.',
    },
  });

  console.log('Seed completed successfully.');
  console.log('Demo credentials:');
  console.log('Email: admin@taller.demo');
  console.log('Password: Admin123!');
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