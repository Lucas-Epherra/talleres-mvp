import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WorkOrderStatus } from '@prisma/client';
import { DEMO_WORKSHOP_ID } from '../../common/constants/demo-workshop.constant';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

/**
 * Handles vehicle persistence and lookup operations.
 *
 * Every query is scoped by workshopId to preserve multi-tenant safety from the
 * beginning of the project.
 */
@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns vehicles for the current workshop.
   *
   * Search matches license plate, brand, model, customer name or customer phone.
   */
  async findAll(search?: string) {
    const where: Prisma.VehicleWhereInput = {
      workshopId: DEMO_WORKSHOP_ID,
      ...(search
        ? {
            OR: [
              {
                licensePlate: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                brand: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                model: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                customer: {
                  fullName: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
              {
                customer: {
                  phone: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
            ],
          }
        : {}),
    };

    return this.prisma.vehicle.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        _count: {
          select: {
            workOrders: true,
          },
        },
      },
    });
  }

  /**
   * Returns one vehicle if it belongs to the current workshop.
   */
  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id,
        workshopId: DEMO_WORKSHOP_ID,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            address: true,
            notes: true,
          },
        },
        workOrders: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }

    return vehicle;
  }

  /**
   * Returns the complete operational vehicle profile.
   *
   * This endpoint is designed to feed the future vehicle profile page in the
   * frontend, including customer data, active work orders, historical work
   * orders and a compact summary.
   */
  async findProfile(id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id,
        workshopId: DEMO_WORKSHOP_ID,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            address: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        workOrders: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            orderNumber: true,
            reportedIssue: true,
            diagnosis: true,
            workDone: true,
            partsUsed: true,
            entryMileage: true,
            laborCost: true,
            partsCost: true,
            estimatedTotal: true,
            finalTotal: true,
            status: true,
            entryDate: true,
            deliveryDate: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }

    const activeWorkOrders = vehicle.workOrders.filter(
      (workOrder) => workOrder.status !== WorkOrderStatus.DELIVERED,
    );

    const history = vehicle.workOrders.filter(
      (workOrder) => workOrder.status === WorkOrderStatus.DELIVERED,
    );

    const latestWorkOrder = vehicle.workOrders[0] ?? null;
    const latestActiveWorkOrder = activeWorkOrders[0] ?? null;

    return {
      vehicle: {
        id: vehicle.id,
        workshopId: vehicle.workshopId,
        customerId: vehicle.customerId,
        licensePlate: vehicle.licensePlate,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        mileage: vehicle.mileage,
        notes: vehicle.notes,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
      },
      customer: vehicle.customer,
      activeWorkOrders,
      history,
      currentStatus: latestActiveWorkOrder?.status ?? 'NO_ACTIVE_WORK_ORDER',
      summary: {
        totalWorkOrders: vehicle.workOrders.length,
        activeWorkOrders: activeWorkOrders.length,
        deliveredWorkOrders: history.length,
        latestWorkOrder,
        latestActiveWorkOrder,
      },
    };
  }

  /**
   * Creates a vehicle associated with an existing customer from the same workshop.
   */
  async create(dto: CreateVehicleDto) {
    await this.ensureCustomerBelongsToWorkshop(dto.customerId);
    await this.ensureLicensePlateIsAvailable(dto.licensePlate);

    return this.prisma.vehicle.create({
      data: {
        workshopId: DEMO_WORKSHOP_ID,
        customerId: dto.customerId,
        licensePlate: this.normalizeLicensePlate(dto.licensePlate),
        brand: dto.brand,
        model: dto.model,
        year: dto.year,
        mileage: dto.mileage,
        notes: dto.notes,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Updates a vehicle if it belongs to the current workshop.
   */
  async update(id: string, dto: UpdateVehicleDto) {
    const currentVehicle = await this.findOne(id);

    if (dto.customerId) {
      await this.ensureCustomerBelongsToWorkshop(dto.customerId);
    }

    if (
      dto.licensePlate &&
      this.normalizeLicensePlate(dto.licensePlate) !== currentVehicle.licensePlate
    ) {
      await this.ensureLicensePlateIsAvailable(dto.licensePlate, id);
    }

    return this.prisma.vehicle.update({
      where: {
        id,
      },
      data: {
        customerId: dto.customerId,
        licensePlate: dto.licensePlate
          ? this.normalizeLicensePlate(dto.licensePlate)
          : undefined,
        brand: dto.brand,
        model: dto.model,
        year: dto.year,
        mileage: dto.mileage,
        notes: dto.notes,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Ensures the customer exists inside the current workshop.
   */
  private async ensureCustomerBelongsToWorkshop(customerId: string): Promise<void> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        workshopId: DEMO_WORKSHOP_ID,
      },
      select: {
        id: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }
  }

  /**
   * Prevents duplicated license plates inside the same workshop.
   */
  private async ensureLicensePlateIsAvailable(
    licensePlate: string,
    currentVehicleId?: string,
  ): Promise<void> {
    const normalizedLicensePlate = this.normalizeLicensePlate(licensePlate);

    const existingVehicle = await this.prisma.vehicle.findFirst({
      where: {
        workshopId: DEMO_WORKSHOP_ID,
        licensePlate: normalizedLicensePlate,
        ...(currentVehicleId
          ? {
              id: {
                not: currentVehicleId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (existingVehicle) {
      throw new ConflictException('License plate already exists.');
    }
  }

  /**
   * Normalizes license plates to avoid duplicates caused by casing or spaces.
   */
  private normalizeLicensePlate(licensePlate: string): string {
    return licensePlate.trim().toUpperCase().replaceAll(' ', '');
  }
}