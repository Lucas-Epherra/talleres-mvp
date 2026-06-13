import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WorkOrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';

const INITIAL_ORDER_NUMBER = 1000;
const CREATE_ORDER_MAX_ATTEMPTS = 3;
const MAX_SEARCH_LENGTH = 80;
const MAX_MILEAGE = 2000000;
const MAX_MONEY_VALUE = 9999999999.99;

type WorkOrdersPrismaClient = PrismaService | Prisma.TransactionClient;

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
    const normalizedSearch = this.normalizeSearch(search);
    const normalizedLicensePlateSearch =
      this.normalizeLicensePlateSearch(normalizedSearch);
    const searchedOrderNumber = this.parseOrderNumberSearch(normalizedSearch);

    const where: Prisma.WorkOrderWhereInput = {
      workshopId,
      ...(status ? { status } : {}),
      ...(normalizedSearch
        ? {
            OR: [
              ...(searchedOrderNumber
                ? [
                    {
                      orderNumber: searchedOrderNumber,
                    },
                  ]
                : []),
              {
                reportedIssue: {
                  contains: normalizedSearch,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                diagnosis: {
                  contains: normalizedSearch,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              ...(normalizedLicensePlateSearch
                ? [
                    {
                      vehicle: {
                        licensePlate: {
                          contains: normalizedLicensePlateSearch,
                          mode: Prisma.QueryMode.insensitive,
                        },
                      },
                    },
                  ]
                : []),
              {
                vehicle: {
                  brand: {
                    contains: normalizedSearch,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
              {
                vehicle: {
                  model: {
                    contains: normalizedSearch,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
              {
                vehicle: {
                  customer: {
                    fullName: {
                      contains: normalizedSearch,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              },
              {
                vehicle: {
                  customer: {
                    phone: {
                      contains: normalizedSearch,
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
      throw new NotFoundException('Orden de trabajo no encontrada.');
    }

    return workOrder;
  }

  /**
   * Creates a work order for a vehicle from the authenticated user's workshop.
   *
   * The order number is generated per workshop and guarded by a database unique
   * constraint plus retry logic to handle concurrent requests.
   */
  async create(workshopId: string, dto: CreateWorkOrderDto) {
    const data = {
      vehicleId: dto.vehicleId,
      reportedIssue: this.normalizeRequiredText(
        dto.reportedIssue,
        'Problema reportado',
        500,
      ),
      diagnosis: this.normalizeNullableText(dto.diagnosis, 'Diagnóstico', 1000),
      workDone: this.normalizeNullableText(
        dto.workDone,
        'Trabajo realizado',
        1000,
      ),
      partsUsed: this.normalizeNullableText(
        dto.partsUsed,
        'Repuestos usados',
        2000,
      ),
      entryMileage: this.normalizeMileage(dto.entryMileage),
      laborCost: this.normalizeMoney(dto.laborCost, 'Mano de obra'),
      partsCost: this.normalizeMoney(dto.partsCost, 'Repuestos'),
      estimatedTotal: this.normalizeMoney(dto.estimatedTotal, 'Total estimado'),
      finalTotal: this.normalizeMoney(dto.finalTotal, 'Total final'),
      notes: this.normalizeNullableText(dto.notes, 'Notas', 800),
    };

    for (let attempt = 1; attempt <= CREATE_ORDER_MAX_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const vehicle = await this.ensureVehicleBelongsToWorkshop(
            workshopId,
            data.vehicleId,
            tx,
          );

          const orderNumber = await this.getNextOrderNumber(workshopId, tx);

          const workOrder = await tx.workOrder.create({
            data: {
              workshopId,
              vehicleId: vehicle.id,
              orderNumber,
              reportedIssue: data.reportedIssue,
              diagnosis: data.diagnosis,
              workDone: data.workDone,
              partsUsed: data.partsUsed,
              entryMileage: data.entryMileage,
              laborCost: data.laborCost,
              partsCost: data.partsCost,
              estimatedTotal: data.estimatedTotal,
              finalTotal: data.finalTotal,
              notes: data.notes,
            },
            include: this.getDefaultInclude(),
          });

          if (data.entryMileage !== undefined) {
            await this.updateVehicleMileageIfNeeded(
              workshopId,
              vehicle.id,
              data.entryMileage,
              tx,
            );
          }

          return workOrder;
        });
      } catch (error) {
        if (
          this.isUniqueConstraintError(error) &&
          attempt < CREATE_ORDER_MAX_ATTEMPTS
        ) {
          continue;
        }

        this.handlePrismaWriteError(error);
      }
    }

    throw new ConflictException(
      'No se pudo generar un número de orden único. Intentá nuevamente.',
    );
  }

  /**
   * Updates a work order if it belongs to the authenticated user's workshop.
   */
  async update(workshopId: string, id: string, dto: UpdateWorkOrderDto) {
    const currentWorkOrder = await this.findOne(workshopId, id);

    const nextStatus = dto.status;
    const deliveryDate = this.resolveDeliveryDate(
      currentWorkOrder.status,
      currentWorkOrder.deliveryDate,
      nextStatus,
    );

    try {
      const updatedWorkOrder = await this.prisma.workOrder.update({
        where: {
          id: currentWorkOrder.id,
        },
        data: {
          reportedIssue:
            dto.reportedIssue !== undefined
              ? this.normalizeRequiredText(
                  dto.reportedIssue,
                  'Problema reportado',
                  500,
                )
              : undefined,
          diagnosis: this.normalizeOptionalNullableText(
            dto.diagnosis,
            'Diagnóstico',
            1000,
          ),
          workDone: this.normalizeOptionalNullableText(
            dto.workDone,
            'Trabajo realizado',
            1000,
          ),
          partsUsed: this.normalizeOptionalNullableText(
            dto.partsUsed,
            'Repuestos usados',
            2000,
          ),
          entryMileage: this.normalizeMileage(dto.entryMileage),
          laborCost: this.normalizeMoney(dto.laborCost, 'Mano de obra'),
          partsCost: this.normalizeMoney(dto.partsCost, 'Repuestos'),
          estimatedTotal: this.normalizeMoney(
            dto.estimatedTotal,
            'Total estimado',
          ),
          finalTotal: this.normalizeMoney(dto.finalTotal, 'Total final'),
          status: nextStatus,
          deliveryDate,
          notes: this.normalizeOptionalNullableText(dto.notes, 'Notas', 800),
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
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  /**
   * Updates only the status of a work order if it belongs to the authenticated user's workshop.
   */
  async updateStatus(
    workshopId: string,
    id: string,
    dto: UpdateWorkOrderStatusDto,
  ) {
    const currentWorkOrder = await this.findOne(workshopId, id);

    const deliveryDate = this.resolveDeliveryDate(
      currentWorkOrder.status,
      currentWorkOrder.deliveryDate,
      dto.status,
    );

    try {
      return await this.prisma.workOrder.update({
        where: {
          id: currentWorkOrder.id,
        },
        data: {
          status: dto.status,
          deliveryDate,
        },
        include: this.getDefaultInclude(),
      });
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  /**
   * Ensures a vehicle exists in the authenticated user's workshop before creating a work order.
   */
  private async ensureVehicleBelongsToWorkshop(
    workshopId: string,
    vehicleId: string,
    prisma: WorkOrdersPrismaClient = this.prisma,
  ) {
    const vehicle = await prisma.vehicle.findFirst({
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
      throw new NotFoundException('Vehículo no encontrado.');
    }

    return vehicle;
  }

  /**
   * Generates the next order number for the authenticated user's workshop.
   */
  private async getNextOrderNumber(
    workshopId: string,
    prisma: WorkOrdersPrismaClient = this.prisma,
  ): Promise<number> {
    const lastWorkOrder = await prisma.workOrder.findFirst({
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

    return (lastWorkOrder?.orderNumber ?? INITIAL_ORDER_NUMBER) + 1;
  }

  /**
   * Updates the vehicle mileage only when the new mileage is greater than the
   * last known mileage.
   */
  private async updateVehicleMileageIfNeeded(
    workshopId: string,
    vehicleId: string,
    entryMileage: number,
    prisma: WorkOrdersPrismaClient = this.prisma,
  ): Promise<void> {
    const vehicle = await prisma.vehicle.findFirst({
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
      throw new NotFoundException('Vehículo no encontrado.');
    }

    if (vehicle.mileage === null || entryMileage > vehicle.mileage) {
      await prisma.vehicle.update({
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
   * Prevents delivered orders from being reopened accidentally.
   */
  private resolveDeliveryDate(
    currentStatus: WorkOrderStatus,
    currentDeliveryDate: Date | null,
    nextStatus?: WorkOrderStatus,
  ): Date | undefined {
    if (!nextStatus) {
      return undefined;
    }

    if (
      currentStatus === WorkOrderStatus.DELIVERED &&
      nextStatus !== WorkOrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Una orden entregada no puede volver a un estado anterior.',
      );
    }

    if (nextStatus === WorkOrderStatus.DELIVERED) {
      return currentDeliveryDate ?? new Date();
    }

    return undefined;
  }

  /**
   * Normalizes search text and caps it to avoid unnecessarily expensive queries.
   */
  private normalizeSearch(search?: string): string | undefined {
    const normalizedSearch = search?.trim().replace(/\s+/g, ' ');

    if (!normalizedSearch) {
      return undefined;
    }

    return normalizedSearch.slice(0, MAX_SEARCH_LENGTH);
  }

  /**
   * Normalizes a search value specifically for license plate matching.
   */
  private normalizeLicensePlateSearch(search?: string): string | undefined {
    const normalizedSearch = search
      ?.trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    return normalizedSearch || undefined;
  }

  /**
   * Parses an exact numeric order number from the search value.
   */
  private parseOrderNumberSearch(search?: string): number | undefined {
    if (!search || !/^\d+$/.test(search)) {
      return undefined;
    }

    const orderNumber = Number(search);

    return Number.isSafeInteger(orderNumber) ? orderNumber : undefined;
  }

  /**
   * Normalizes required text fields and rejects blank values.
   */
  private normalizeRequiredText(
    value: string,
    fieldName: string,
    maxLength: number,
  ): string {
    const normalizedValue = value.trim().replace(/\s+/g, ' ');

    if (!normalizedValue) {
      throw new BadRequestException(`${fieldName} es obligatorio.`);
    }

    if (normalizedValue.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} no puede superar ${maxLength} caracteres.`,
      );
    }

    return normalizedValue;
  }

  /**
   * Normalizes optional nullable text on create operations.
   */
  private normalizeNullableText(
    value: string | undefined,
    fieldName: string,
    maxLength: number,
  ): string | null {
    const normalizedValue = this.normalizeOptionalNullableText(
      value,
      fieldName,
      maxLength,
    );

    return normalizedValue ?? null;
  }

  /**
   * Normalizes optional nullable text on update operations.
   *
   * Undefined means "do not update". Empty string means "clear value".
   */
  private normalizeOptionalNullableText(
    value: string | undefined,
    fieldName: string,
    maxLength: number,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalizedValue = value.trim().replace(/\s+/g, ' ');

    if (!normalizedValue) {
      return null;
    }

    if (normalizedValue.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} no puede superar ${maxLength} caracteres.`,
      );
    }

    return normalizedValue;
  }

  /**
   * Validates vehicle mileage received from a work order.
   */
  private normalizeMileage(mileage: number | undefined): number | undefined {
    if (mileage === undefined) {
      return undefined;
    }

    if (!Number.isInteger(mileage) || mileage < 0 || mileage > MAX_MILEAGE) {
      throw new BadRequestException(
        `El kilometraje debe estar entre 0 y ${MAX_MILEAGE}.`,
      );
    }

    return mileage;
  }

  /**
   * Validates and converts money values to Prisma Decimal.
   */
  private normalizeMoney(
    value: number | undefined,
    fieldName: string,
  ): Prisma.Decimal | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (!Number.isFinite(value) || value < 0 || value > MAX_MONEY_VALUE) {
      throw new BadRequestException(
        `${fieldName} debe ser un número entre 0 y ${MAX_MONEY_VALUE}.`,
      );
    }

    return new Prisma.Decimal(value.toFixed(2));
  }

  /**
   * Checks if a Prisma error came from a unique constraint.
   */
  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  /**
   * Converts Prisma write errors into safe API exceptions.
   */
  private handlePrismaWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'No se pudo generar un número de orden único. Intentá nuevamente.',
        );
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('Orden de trabajo no encontrada.');
      }
    }

    throw error;
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