import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WorkOrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';

/**
 * Handles work order persistence and operational updates.
 *
 * Every query is scoped by workshopId to keep the system compatible with
 * a future multi-tenant SaaS model.
 */
@Injectable()
export class WorkOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns work orders for the authenticated user's workshop.
   *
   * Search matches issue, diagnosis, vehicle data and customer data.
   */
  async findAll(
    workshopId: string,
    search?: string,
    status?: WorkOrderStatus,
  ) {
    const where: Prisma.WorkOrderWhereInput = {
      workshopId,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              {
                reportedIssue: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                diagnosis: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                vehicle: {
                  licensePlate: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
              {
                vehicle: {
                  brand: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
              {
                vehicle: {
                  model: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
              {
                vehicle: {
                  customer: {
                    fullName: {
                      contains: search,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              },
              {
                vehicle: {
                  customer: {
                    phone: {
                      contains: search,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    return this.prisma.workOrder.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Returns one work order if it belongs to the authenticated user's workshop.
   */
  async findOne(workshopId: string, id: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: {
        id,
        workshopId,
      },
      include: this.getDefaultInclude(),
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found.');
    }

    return workOrder;
  }

  /**
   * Creates a work order for a vehicle from the authenticated user's workshop.
   *
   * The order number is generated per workshop.
   */
  async create(workshopId: string, dto: CreateWorkOrderDto) {
    const vehicle = await this.ensureVehicleBelongsToWorkshop(
      workshopId,
      dto.vehicleId,
    );

    const orderNumber = await this.getNextOrderNumber(workshopId);

    const workOrder = await this.prisma.workOrder.create({
      data: {
        workshopId,
        vehicleId: vehicle.id,
        orderNumber,
        reportedIssue: dto.reportedIssue,
        diagnosis: dto.diagnosis,
        workDone: dto.workDone,
        partsUsed: dto.partsUsed,
        entryMileage: dto.entryMileage,
        laborCost: dto.laborCost,
        partsCost: dto.partsCost,
        estimatedTotal: dto.estimatedTotal,
        finalTotal: dto.finalTotal,
        notes: dto.notes,
      },
      include: this.getDefaultInclude(),
    });

    if (dto.entryMileage !== undefined) {
      await this.updateVehicleMileageIfNeeded(
        workshopId,
        vehicle.id,
        dto.entryMileage,
      );
    }

    return workOrder;
  }

  /**
   * Updates a work order if it belongs to the authenticated user's workshop.
   */
  async update(workshopId: string, id: string, dto: UpdateWorkOrderDto) {
    const currentWorkOrder = await this.findOne(workshopId, id);

    const updatedWorkOrder = await this.prisma.workOrder.update({
      where: {
        id,
      },
      data: {
        reportedIssue: dto.reportedIssue,
        diagnosis: dto.diagnosis,
        workDone: dto.workDone,
        partsUsed: dto.partsUsed,
        entryMileage: dto.entryMileage,
        laborCost: dto.laborCost,
        partsCost: dto.partsCost,
        estimatedTotal: dto.estimatedTotal,
        finalTotal: dto.finalTotal,
        status: dto.status,
        deliveryDate:
          dto.status === WorkOrderStatus.DELIVERED ? new Date() : undefined,
        notes: dto.notes,
      },
      include: this.getDefaultInclude(),
    });

    if (dto.entryMileage !== undefined) {
      await this.updateVehicleMileageIfNeeded(
        workshopId,
        currentWorkOrder.vehicleId,
        dto.entryMileage,
      );
    }

    return updatedWorkOrder;
  }

  /**
   * Updates only the status of a work order if it belongs to the authenticated user's workshop.
   */
  async updateStatus(
    workshopId: string,
    id: string,
    dto: UpdateWorkOrderStatusDto,
  ) {
    await this.findOne(workshopId, id);

    return this.prisma.workOrder.update({
      where: {
        id,
      },
      data: {
        status: dto.status,
        deliveryDate:
          dto.status === WorkOrderStatus.DELIVERED ? new Date() : undefined,
      },
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Ensures a vehicle exists in the authenticated user's workshop before creating a work order.
   */
  private async ensureVehicleBelongsToWorkshop(
    workshopId: string,
    vehicleId: string,
  ) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        workshopId,
      },
      select: {
        id: true,
        mileage: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }

    return vehicle;
  }

  /**
   * Generates the next order number for the authenticated user's workshop.
   */
  private async getNextOrderNumber(workshopId: string): Promise<number> {
    const lastWorkOrder = await this.prisma.workOrder.findFirst({
      where: {
        workshopId,
      },
      orderBy: {
        orderNumber: 'desc',
      },
      select: {
        orderNumber: true,
      },
    });

    return (lastWorkOrder?.orderNumber ?? 1000) + 1;
  }

  /**
   * Updates the vehicle mileage only when the new mileage is greater than the
   * last known mileage.
   */
  private async updateVehicleMileageIfNeeded(
    workshopId: string,
    vehicleId: string,
    entryMileage: number,
  ): Promise<void> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        workshopId,
      },
      select: {
        id: true,
        mileage: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }

    if (vehicle.mileage === null || entryMileage > vehicle.mileage) {
      await this.prisma.vehicle.update({
        where: {
          id: vehicle.id,
        },
        data: {
          mileage: entryMileage,
        },
      });
    }
  }

  /**
   * Default relation shape returned by work order endpoints.
   */
  private getDefaultInclude() {
    return {
      vehicle: {
        select: {
          id: true,
          licensePlate: true,
          brand: true,
          model: true,
          year: true,
          mileage: true,
          customer: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
            },
          },
        },
      },
    } satisfies Prisma.WorkOrderInclude;
  }
}