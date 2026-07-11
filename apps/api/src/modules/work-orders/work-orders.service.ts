import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  SupplierMarkupType,
  WorkOrderEventType,
  WorkOrderStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { ReopenWorkOrderDto } from './dto/reopen-work-order.dto';
import { CancelWorkOrderDto } from './dto/cancel-work-order.dto';
import { FindWorkOrdersQueryDto } from './dto/find-work-orders-query.dto';
import type { WorkOrderPartLineDto } from './dto/work-order-part-line.dto';

const INITIAL_ORDER_NUMBER = 1000;
const CREATE_ORDER_MAX_ATTEMPTS = 3;
const MAX_SEARCH_LENGTH = 80;
const MAX_MILEAGE = 2000000;
const MAX_MONEY_VALUE = 9999999999.99;
const MAX_WORK_ORDER_PART_LINES = 100;
const MAX_PART_LINE_QUANTITY = 999999.99;
const MAX_PART_LINE_NAME_LENGTH = 160;
const MAX_PART_LINE_NOTES_LENGTH = 500;

const DEFAULT_WORK_ORDERS_PAGE = 1;
const DEFAULT_WORK_ORDERS_LIMIT = 10;

type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

type WorkOrdersPrismaClient = PrismaService | Prisma.TransactionClient;

type WorkOrderVehicleContext = {
  id: string;
  mileage: number | null;
  archivedAt: Date | null;
  customer: {
    archivedAt: Date | null;
  };
};

type NormalizedWorkOrderPartLine = {
  supplierId: string | null;
  supplierPartId: string | null;
  partNameSnapshot: string;
  supplierNameSnapshot: string | null;
  quantity: Prisma.Decimal;
  supplierUnitCost: Prisma.Decimal;
  customerUnitPrice: Prisma.Decimal;
  markupType: SupplierMarkupType;
  markupValue: Prisma.Decimal | null;
  supplierSubtotal: Prisma.Decimal;
  customerSubtotal: Prisma.Decimal;
  grossProfit: Prisma.Decimal;
  purchasedAt: Date;
  notes: string | null;
};

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
   * Returns paginated work orders for the authenticated user's workshop.
   *
   * Search matches issue, diagnosis, vehicle data and customer data.
   */
  async findAll(workshopId: string, query: FindWorkOrdersQueryDto = {}) {
    const page = query.page ?? DEFAULT_WORK_ORDERS_PAGE;
    const limit = query.limit ?? DEFAULT_WORK_ORDERS_LIMIT;
    const skip = (page - 1) * limit;
    const normalizedSearch = this.normalizeSearch(query.search);
    const normalizedLicensePlateSearch =
      this.normalizeLicensePlateSearch(normalizedSearch);
    const searchedOrderNumber = this.parseOrderNumberSearch(normalizedSearch);

    const where: Prisma.WorkOrderWhereInput = {
      workshopId,
      ...(query.status ? { status: query.status } : {}),
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

    const [totalItems, data] = await this.prisma.$transaction([
      this.prisma.workOrder.count({
        where,
      }),
      this.prisma.workOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: this.getDefaultInclude(),
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    const meta: PaginationMeta = {
      page,
      limit,
      totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    };

    return {
      data,
      meta,
    };
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
      include: this.getDetailInclude(),
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
  async create(workshopId: string, userId: string, dto: CreateWorkOrderDto) {
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
      partsUsed: this.normalizeNullableMultilineText(
        dto.partsUsed,
        'Repuestos usados',
        2000,
      ),
      entryMileage: this.normalizeMileage(dto.entryMileage),
      laborCost: this.normalizeMoney(dto.laborCost, 'Mano de obra'),
      partsCost: this.normalizeMoney(dto.partsCost, 'Repuestos'),
      estimatedTotal: this.normalizeMoney(dto.estimatedTotal, 'Total estimado'),
      finalTotal: this.normalizeMoney(dto.finalTotal, 'Total final'),
      notes: this.normalizeNullableMultilineText(dto.notes, 'Notas', 800),
    };

    for (let attempt = 1; attempt <= CREATE_ORDER_MAX_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const vehicle = await this.ensureVehicleBelongsToWorkshop(
            workshopId,
            data.vehicleId,
            tx,
          );
          const partLines = await this.normalizeWorkOrderPartLines(
            workshopId,
            dto.partLines,
            tx,
          );
          const financials = this.resolveCreateFinancials({
            laborCost: data.laborCost,
            legacyPartsCost: data.partsCost,
            legacyEstimatedTotal: data.estimatedTotal,
            legacyFinalTotal: data.finalTotal,
            partLines,
            hasStructuredPartLines: dto.partLines !== undefined,
          });

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
              partsCost: financials.partsCost,
              estimatedTotal: financials.estimatedTotal,
              finalTotal: financials.finalTotal,
              notes: data.notes,
              ...(partLines.length > 0
                ? {
                    partLines: {
                      create: partLines.map((partLine) => ({
                        workshopId,
                        supplierId: partLine.supplierId,
                        supplierPartId: partLine.supplierPartId,
                        partNameSnapshot: partLine.partNameSnapshot,
                        supplierNameSnapshot: partLine.supplierNameSnapshot,
                        quantity: partLine.quantity,
                        supplierUnitCost: partLine.supplierUnitCost,
                        customerUnitPrice: partLine.customerUnitPrice,
                        markupType: partLine.markupType,
                        markupValue: partLine.markupValue,
                        supplierSubtotal: partLine.supplierSubtotal,
                        customerSubtotal: partLine.customerSubtotal,
                        grossProfit: partLine.grossProfit,
                        purchasedAt: partLine.purchasedAt,
                        notes: partLine.notes,
                      })),
                    },
                  }
                : {}),
            },
            include: this.getDefaultInclude(),
          });

          await this.createWorkOrderEvent({
            prisma: tx,
            workshopId,
            workOrderId: workOrder.id,
            userId,
            type: WorkOrderEventType.CREATED,
            toStatus: workOrder.status,
            description: `Se creó la orden #${workOrder.orderNumber}.`,
          });

          if (typeof data.entryMileage === 'number') {
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
  async update(
    workshopId: string,
    userId: string,
    id: string,
    dto: UpdateWorkOrderDto,
  ) {
    const currentWorkOrder = await this.findOne(workshopId, id);
    if (currentWorkOrder.status === WorkOrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Una orden entregada no puede editarse. Reabrila primero con un motivo.',
      );
    }

    if (currentWorkOrder.status === WorkOrderStatus.CANCELLED) {
      throw new BadRequestException('Una orden anulada no puede editarse.');
    }

    if (dto.status === WorkOrderStatus.CANCELLED) {
      throw new BadRequestException(
        'Para anular una orden usá la acción de anulación con motivo.',
      );
    }
    const nextStatus = dto.status;
    const deliveryDate = this.resolveDeliveryDate(
      currentWorkOrder.status,
      currentWorkOrder.deliveryDate,
      nextStatus,
    );

    try {
      return await this.prisma.$transaction(async (tx) => {
        const nextLaborCost = this.normalizeMoney(dto.laborCost, 'Mano de obra');
        const partLines =
          dto.partLines !== undefined
            ? await this.normalizeWorkOrderPartLines(
                workshopId,
                dto.partLines,
                tx,
              )
            : undefined;
        const financials = this.resolveUpdateFinancials({
          currentLaborCost: currentWorkOrder.laborCost,
          nextLaborCost,
          legacyPartsCost: this.normalizeMoney(dto.partsCost, 'Repuestos'),
          legacyEstimatedTotal: this.normalizeMoney(
            dto.estimatedTotal,
            'Total estimado',
          ),
          legacyFinalTotal: this.normalizeMoney(dto.finalTotal, 'Total final'),
          partLines,
          hasStructuredPartLines: dto.partLines !== undefined,
        });

        const updatedWorkOrder = await tx.workOrder.update({
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
            partsUsed: this.normalizeOptionalNullableMultilineText(
              dto.partsUsed,
              'Repuestos usados',
              2000,
            ),
            entryMileage: this.normalizeMileage(dto.entryMileage),
            laborCost: nextLaborCost,
            partsCost: financials.partsCost,
            estimatedTotal: financials.estimatedTotal,
            finalTotal: financials.finalTotal,
            status: nextStatus,
            deliveryDate,
            notes: this.normalizeOptionalNullableMultilineText(
              dto.notes,
              'Notas',
              800,
            ),
          },
          include: this.getDefaultInclude(),
        });

        if (partLines !== undefined) {
          await tx.workOrderPartLine.deleteMany({
            where: {
              workshopId,
              workOrderId: currentWorkOrder.id,
            },
          });

          if (partLines.length > 0) {
            await tx.workOrderPartLine.createMany({
              data: partLines.map((partLine) => ({
                workshopId,
                workOrderId: currentWorkOrder.id,
                supplierId: partLine.supplierId,
                supplierPartId: partLine.supplierPartId,
                partNameSnapshot: partLine.partNameSnapshot,
                supplierNameSnapshot: partLine.supplierNameSnapshot,
                quantity: partLine.quantity,
                supplierUnitCost: partLine.supplierUnitCost,
                customerUnitPrice: partLine.customerUnitPrice,
                markupType: partLine.markupType,
                markupValue: partLine.markupValue,
                supplierSubtotal: partLine.supplierSubtotal,
                customerSubtotal: partLine.customerSubtotal,
                grossProfit: partLine.grossProfit,
                purchasedAt: partLine.purchasedAt,
                notes: partLine.notes,
              })),
            });
          }
        }

        if (typeof dto.entryMileage === 'number') {
          await this.updateVehicleMileageIfNeeded(
            workshopId,
            currentWorkOrder.vehicleId,
            dto.entryMileage,
            tx,
          );
        }

        const eventType = this.resolveUpdateEventType(
          currentWorkOrder.status,
          updatedWorkOrder.status,
          nextStatus,
        );
        const isStatusEvent =
          eventType === WorkOrderEventType.STATUS_CHANGED ||
          eventType === WorkOrderEventType.DELIVERED;

        await this.createWorkOrderEvent({
          prisma: tx,
          workshopId,
          workOrderId: updatedWorkOrder.id,
          userId,
          type: eventType,
          fromStatus: isStatusEvent ? currentWorkOrder.status : null,
          toStatus: isStatusEvent ? updatedWorkOrder.status : null,
          description: this.getWorkOrderEventDescription(
            eventType,
            updatedWorkOrder.orderNumber,
            currentWorkOrder.status,
            updatedWorkOrder.status,
          ),
        });

        return updatedWorkOrder;
      });
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  /**
   * Updates only the status of a work order if it belongs to the authenticated user's workshop.
   */
  async updateStatus(
    workshopId: string,
    userId: string,
    id: string,
    dto: UpdateWorkOrderStatusDto,
  ) {
    const currentWorkOrder = await this.findOne(workshopId, id);

    if (currentWorkOrder.status === WorkOrderStatus.CANCELLED) {
      throw new BadRequestException(
        'Una orden anulada no puede volver al flujo operativo.',
      );
    }

    if (dto.status === WorkOrderStatus.CANCELLED) {
      throw new BadRequestException(
        'Para anular una orden usá la acción de anulación con motivo.',
      );
    }

    const deliveryDate = this.resolveDeliveryDate(
      currentWorkOrder.status,
      currentWorkOrder.deliveryDate,
      dto.status,
    );

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updatedWorkOrder = await tx.workOrder.update({
          where: {
            id: currentWorkOrder.id,
          },
          data: {
            status: dto.status,
            deliveryDate,
          },
          include: this.getDefaultInclude(),
        });

        const eventType =
          dto.status === WorkOrderStatus.DELIVERED
            ? WorkOrderEventType.DELIVERED
            : WorkOrderEventType.STATUS_CHANGED;

        await this.createWorkOrderEvent({
          prisma: tx,
          workshopId,
          workOrderId: updatedWorkOrder.id,
          userId,
          type: eventType,
          fromStatus: currentWorkOrder.status,
          toStatus: updatedWorkOrder.status,
          description: this.getWorkOrderEventDescription(
            eventType,
            updatedWorkOrder.orderNumber,
            currentWorkOrder.status,
            updatedWorkOrder.status,
          ),
        });

        return updatedWorkOrder;
      });
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }
  /**
   * Reopens a delivered work order and keeps the operation auditable.
   *
   * Delivered orders cannot be moved backwards through the normal status flow.
   * This explicit operation requires a reason and always returns the order to
   * READY, leaving the correction visible in the timeline.
   */
  async reopen(
    workshopId: string,
    userId: string,
    id: string,
    dto: ReopenWorkOrderDto,
  ) {
    const currentWorkOrder = await this.findOne(workshopId, id);

    if (currentWorkOrder.status !== WorkOrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Solo se puede reabrir una orden entregada.',
      );
    }

    const reason = this.normalizeRequiredText(
      dto.reason,
      'Motivo de reapertura',
      500,
    );

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updatedWorkOrder = await tx.workOrder.update({
          where: {
            id: currentWorkOrder.id,
          },
          data: {
            status: WorkOrderStatus.READY,
            deliveryDate: null,
          },
          include: this.getDefaultInclude(),
        });

        await this.createWorkOrderEvent({
          prisma: tx,
          workshopId,
          workOrderId: updatedWorkOrder.id,
          userId,
          type: WorkOrderEventType.REOPENED,
          fromStatus: WorkOrderStatus.DELIVERED,
          toStatus: WorkOrderStatus.READY,
          description: `La orden #${updatedWorkOrder.orderNumber} fue reabierta. Motivo: ${reason}`,
        });

        return updatedWorkOrder;
      });
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  /**
   * Cancels an open work order and keeps the operation auditable.
   *
   * Delivered orders must be reopened first before cancellation. Cancelled
   * orders cannot return to the normal workflow.
   */
  async cancel(
    workshopId: string,
    userId: string,
    id: string,
    dto: CancelWorkOrderDto,
  ) {
    const currentWorkOrder = await this.findOne(workshopId, id);

    if (currentWorkOrder.status === WorkOrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Una orden entregada no puede anularse directamente. Reabrila primero con un motivo.',
      );
    }

    if (currentWorkOrder.status === WorkOrderStatus.CANCELLED) {
      throw new BadRequestException('Esta orden ya está anulada.');
    }

    const reason = this.normalizeRequiredText(
      dto.reason,
      'Motivo de anulación',
      500,
    );

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updatedWorkOrder = await tx.workOrder.update({
          where: {
            id: currentWorkOrder.id,
          },
          data: {
            status: WorkOrderStatus.CANCELLED,
            deliveryDate: null,
          },
          include: this.getDefaultInclude(),
        });

        await this.createWorkOrderEvent({
          prisma: tx,
          workshopId,
          workOrderId: updatedWorkOrder.id,
          userId,
          type: WorkOrderEventType.CANCELLED,
          fromStatus: currentWorkOrder.status,
          toStatus: WorkOrderStatus.CANCELLED,
          description: `La orden #${updatedWorkOrder.orderNumber} fue anulada. Motivo: ${reason}`,
        });

        return updatedWorkOrder;
      });
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  /**
   * Persists one immutable audit event for a work order operation.
   */
  private async createWorkOrderEvent({
    prisma,
    workshopId,
    workOrderId,
    userId,
    type,
    fromStatus,
    toStatus,
    description,
  }: {
    prisma: WorkOrdersPrismaClient;
    workshopId: string;
    workOrderId: string;
    userId: string;
    type: WorkOrderEventType;
    fromStatus?: WorkOrderStatus | null;
    toStatus?: WorkOrderStatus | null;
    description?: string;
  }): Promise<void> {
    await prisma.workOrderEvent.create({
      data: {
        workshopId,
        workOrderId,
        userId,
        type,
        fromStatus: fromStatus ?? null,
        toStatus: toStatus ?? null,
        description,
      },
    });
  }

  /**
   * Resolves the event type for a general work order update.
   */
  private resolveUpdateEventType(
    currentStatus: WorkOrderStatus,
    updatedStatus: WorkOrderStatus,
    requestedStatus?: WorkOrderStatus,
  ): WorkOrderEventType {
    if (!requestedStatus || currentStatus === updatedStatus) {
      return WorkOrderEventType.UPDATED;
    }

    if (updatedStatus === WorkOrderStatus.DELIVERED) {
      return WorkOrderEventType.DELIVERED;
    }

    return WorkOrderEventType.STATUS_CHANGED;
  }

  /**
   * Builds a human-readable audit description for work order events.
   */
  private getWorkOrderEventDescription(
    type: WorkOrderEventType,
    orderNumber: number,
    fromStatus?: WorkOrderStatus,
    toStatus?: WorkOrderStatus,
  ): string {
    if (type === WorkOrderEventType.CREATED) {
      return `Se creó la orden #${orderNumber}.`;
    }

    if (type === WorkOrderEventType.UPDATED) {
      return `Se actualizó la información operativa de la orden #${orderNumber}.`;
    }

    if (type === WorkOrderEventType.DELIVERED) {
      return `La orden #${orderNumber} fue marcada como entregada.`;
    }
    if (type === WorkOrderEventType.REOPENED) {
      return `La orden #${orderNumber} fue reabierta.`;
    }

    if (type === WorkOrderEventType.CANCELLED) {
      return `La orden #${orderNumber} fue anulada.`;
    }

    return `La orden #${orderNumber} pasó de ${this.formatReadableStatus(
      fromStatus,
    )} a ${this.formatReadableStatus(toStatus)}.`;
  }

  /**
   * Converts work order status values into readable Spanish labels for audit logs.
   */
  private formatReadableStatus(status?: WorkOrderStatus): string {
    if (!status) {
      return 'estado anterior';
    }

    const statusLabels: Record<WorkOrderStatus, string> = {
      PENDING: 'Pendiente',
      IN_PROGRESS: 'En progreso',
      READY: 'Lista para entregar',
      DELIVERED: 'Entregada',
      CANCELLED: 'Anulada',
    };

    return statusLabels[status];
  }

  /**
   * Ensures a vehicle exists in the authenticated user's workshop before creating a work order.
   */

  private async ensureVehicleBelongsToWorkshop(
    workshopId: string,
    vehicleId: string,
    prisma: WorkOrdersPrismaClient = this.prisma,
  ): Promise<WorkOrderVehicleContext> {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        workshopId,
      },
      select: {
        id: true,
        mileage: true,
        archivedAt: true,
        customer: {
          select: {
            archivedAt: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado.');
    }

    if (vehicle.archivedAt) {
      throw new ConflictException(
        'No se puede crear una orden para un vehículo archivado.',
      );
    }

    if (vehicle.customer.archivedAt) {
      throw new ConflictException(
        'No se puede crear una orden para un cliente archivado.',
      );
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
   * Normalizes nullable text on create operations.
   *
   * Empty strings are stored as null. Internal whitespace is collapsed because
   * these fields are plain single-value text fields.
   */
  private normalizeNullableText(
    value: string | null | undefined,
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
   * Undefined means "do not update". Null or empty string means "clear value".
   * Internal whitespace is collapsed because these fields are plain text fields.
   */
  private normalizeOptionalNullableText(
    value: string | null | undefined,
    fieldName: string,
    maxLength: number,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
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
   * Normalizes nullable multiline text on create operations.
   *
   * It preserves line breaks because parts and notes are serialized as one item
   * per line by the frontend forms.
   */
  private normalizeNullableMultilineText(
    value: string | null | undefined,
    fieldName: string,
    maxLength: number,
  ): string | null {
    const normalizedValue = this.normalizeOptionalNullableMultilineText(
      value,
      fieldName,
      maxLength,
    );

    return normalizedValue ?? null;
  }

  /**
   * Normalizes optional nullable multiline text on update operations.
   *
   * Undefined means "do not update". Null or blank means "clear value".
   * Line breaks are preserved so structured text fields keep one item per row.
   */
  private normalizeOptionalNullableMultilineText(
    value: string | null | undefined,
    fieldName: string,
    maxLength: number,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const normalizedLines = value
      .split(/\r?\n/u)
      .map((line) => line.trim().replace(/[ \t]+/g, ' '))
      .filter(Boolean);

    if (normalizedLines.length === 0) {
      return null;
    }

    const normalizedValue = normalizedLines.join('\n');

    if (normalizedValue.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} no puede superar ${maxLength} caracteres.`,
      );
    }

    return normalizedValue;
  }

  /**
   * Validates vehicle mileage received from a work order.
   *
   * Undefined means "do not update". Null means "clear value".
   */
  private normalizeMileage(
    mileage: number | null | undefined,
  ): number | null | undefined {
    if (mileage === undefined) {
      return undefined;
    }

    if (mileage === null) {
      return null;
    }

    if (!Number.isInteger(mileage) || mileage < 0 || mileage > MAX_MILEAGE) {
      throw new BadRequestException(
        `El kilometraje debe estar entre 0 y ${MAX_MILEAGE}.`,
      );
    }

    return mileage;
  }

  /**
   * Normalizes structured work order part lines and calculates monetary totals
   * from backend-trusted supplier/catalog data whenever possible.
   */
  private async normalizeWorkOrderPartLines(
    workshopId: string,
    partLines: WorkOrderPartLineDto[] | undefined,
    prisma: WorkOrdersPrismaClient,
  ): Promise<NormalizedWorkOrderPartLine[]> {
    if (partLines === undefined) {
      return [];
    }

    if (partLines.length > MAX_WORK_ORDER_PART_LINES) {
      throw new BadRequestException(
        `Una orden no puede tener más de ${MAX_WORK_ORDER_PART_LINES} repuestos.`,
      );
    }

    const normalizedPartLines: NormalizedWorkOrderPartLine[] = [];

    for (const [index, partLine] of partLines.entries()) {
      const lineNumber = index + 1;
      const supplierPart = partLine.supplierPartId
        ? await this.findSupplierPartForLine(
            workshopId,
            partLine.supplierPartId,
            prisma,
          )
        : null;
      const supplierId = supplierPart?.supplierId ?? partLine.supplierId ?? null;
      const supplier =
        supplierPart?.supplier ??
        (supplierId
          ? await this.findSupplierForLine(workshopId, supplierId, prisma)
          : null);

      if (
        supplierPart &&
        partLine.supplierId &&
        partLine.supplierId !== supplierPart.supplierId
      ) {
        throw new BadRequestException(
          `El proveedor de la línea ${lineNumber} no coincide con el repuesto seleccionado.`,
        );
      }

      const partNameSnapshot = this.normalizePartLineName(
        partLine.partName ?? supplierPart?.name,
        lineNumber,
      );
      const supplierUnitCost = this.normalizeRequiredMoney(
        partLine.supplierUnitCost ?? this.decimalToNumber(supplierPart?.currentCost),
        `Costo proveedor de la línea ${lineNumber}`,
      );
      const markupType =
        partLine.markupType ??
        supplierPart?.suggestedMarkupType ??
        (partLine.customerUnitPrice !== undefined
          ? SupplierMarkupType.MANUAL_PRICE
          : SupplierMarkupType.NONE);
      const markupValue = this.normalizeMarkupValue(
        partLine.markupValue ??
          this.decimalToNumber(supplierPart?.suggestedMarkupValue),
        markupType,
        lineNumber,
      );
      const customerUnitPrice = this.resolveCustomerUnitPrice({
        supplierUnitCost,
        explicitCustomerUnitPrice: partLine.customerUnitPrice,
        suggestedCustomerPrice: supplierPart?.suggestedCustomerPrice,
        markupType,
        markupValue,
        lineNumber,
      });
      const quantity = this.normalizePartLineQuantity(partLine.quantity, lineNumber);
      const supplierSubtotal = supplierUnitCost.times(quantity).toDecimalPlaces(2);
      const customerSubtotal = customerUnitPrice.times(quantity).toDecimalPlaces(2);
      const grossProfit = customerSubtotal.minus(supplierSubtotal).toDecimalPlaces(2);

      normalizedPartLines.push({
        supplierId,
        supplierPartId: supplierPart?.id ?? null,
        partNameSnapshot,
        supplierNameSnapshot: supplier?.name ?? null,
        quantity,
        supplierUnitCost,
        customerUnitPrice,
        markupType,
        markupValue,
        supplierSubtotal,
        customerSubtotal,
        grossProfit,
        purchasedAt: partLine.purchasedAt
          ? this.normalizePurchasedAt(partLine.purchasedAt, lineNumber)
          : new Date(),
        notes: this.normalizeNullableText(
          partLine.notes,
          `Notas de la línea ${lineNumber}`,
          MAX_PART_LINE_NOTES_LENGTH,
        ),
      });
    }

    return normalizedPartLines;
  }

  /**
   * Returns one active supplier part from this workshop for a structured line.
   */
  private async findSupplierPartForLine(
    workshopId: string,
    supplierPartId: string,
    prisma: WorkOrdersPrismaClient,
  ) {
    const supplierPart = await prisma.supplierPart.findFirst({
      where: {
        id: supplierPartId,
        workshopId,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            archivedAt: true,
          },
        },
      },
    });

    if (!supplierPart || supplierPart.archivedAt || !supplierPart.isActive) {
      throw new NotFoundException('Repuesto de proveedor no encontrado o inactivo.');
    }

    if (supplierPart.supplier.archivedAt) {
      throw new BadRequestException(
        'No se puede usar un repuesto de un proveedor archivado.',
      );
    }

    return supplierPart;
  }

  /**
   * Returns one active supplier from this workshop for manual structured lines.
   */
  private async findSupplierForLine(
    workshopId: string,
    supplierId: string,
    prisma: WorkOrdersPrismaClient,
  ) {
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: supplierId,
        workshopId,
      },
      select: {
        id: true,
        name: true,
        archivedAt: true,
      },
    });

    if (!supplier || supplier.archivedAt) {
      throw new NotFoundException('Proveedor no encontrado o archivado.');
    }

    return supplier;
  }

  /**
   * Resolves financial fields when a work order is created.
   */
  private resolveCreateFinancials({
    laborCost,
    legacyPartsCost,
    legacyEstimatedTotal,
    legacyFinalTotal,
    partLines,
    hasStructuredPartLines,
  }: {
    laborCost: Prisma.Decimal | null | undefined;
    legacyPartsCost: Prisma.Decimal | null | undefined;
    legacyEstimatedTotal: Prisma.Decimal | null | undefined;
    legacyFinalTotal: Prisma.Decimal | null | undefined;
    partLines: NormalizedWorkOrderPartLine[];
    hasStructuredPartLines: boolean;
  }) {
    if (!hasStructuredPartLines) {
      return {
        partsCost: legacyPartsCost,
        estimatedTotal: legacyEstimatedTotal,
        finalTotal: legacyFinalTotal,
      };
    }

    const partsCost = this.sumPartLineCustomerSubtotals(partLines);
    const total = this.calculateWorkOrderTotal(laborCost, partsCost);

    return {
      partsCost: this.nullIfZero(partsCost),
      estimatedTotal: total,
      finalTotal: total,
    };
  }

  /**
   * Resolves financial fields when structured part lines are replaced on edit.
   */
  private resolveUpdateFinancials({
    currentLaborCost,
    nextLaborCost,
    legacyPartsCost,
    legacyEstimatedTotal,
    legacyFinalTotal,
    partLines,
    hasStructuredPartLines,
  }: {
    currentLaborCost: Prisma.Decimal | null | undefined;
    nextLaborCost: Prisma.Decimal | null | undefined;
    legacyPartsCost: Prisma.Decimal | null | undefined;
    legacyEstimatedTotal: Prisma.Decimal | null | undefined;
    legacyFinalTotal: Prisma.Decimal | null | undefined;
    partLines: NormalizedWorkOrderPartLine[] | undefined;
    hasStructuredPartLines: boolean;
  }) {
    if (!hasStructuredPartLines || !partLines) {
      return {
        partsCost: legacyPartsCost,
        estimatedTotal: legacyEstimatedTotal,
        finalTotal: legacyFinalTotal,
      };
    }

    const resolvedLaborCost =
      nextLaborCost === undefined ? currentLaborCost : nextLaborCost;
    const partsCost = this.sumPartLineCustomerSubtotals(partLines);
    const total = this.calculateWorkOrderTotal(resolvedLaborCost, partsCost);

    return {
      partsCost: this.nullIfZero(partsCost),
      estimatedTotal: total,
      finalTotal: total,
    };
  }

  /**
   * Sums the customer-facing value of structured part lines.
   */
  private sumPartLineCustomerSubtotals(
    partLines: NormalizedWorkOrderPartLine[],
  ): Prisma.Decimal {
    return partLines.reduce(
      (total, partLine) => total.plus(partLine.customerSubtotal),
      new Prisma.Decimal(0),
    );
  }

  /**
   * Calculates the total charged to the customer from labor and sale-priced parts.
   */
  private calculateWorkOrderTotal(
    laborCost: Prisma.Decimal | null | undefined,
    partsCost: Prisma.Decimal | null | undefined,
  ): Prisma.Decimal | null {
    const total = new Prisma.Decimal(0)
      .plus(laborCost ?? 0)
      .plus(partsCost ?? 0)
      .toDecimalPlaces(2);

    return total.equals(0) ? null : total;
  }

  /**
   * Converts zero monetary values to null for optional work order totals.
   */
  private nullIfZero(value: Prisma.Decimal): Prisma.Decimal | null {
    return value.equals(0) ? null : value.toDecimalPlaces(2);
  }

  /**
   * Resolves the customer-facing unit price from explicit price or markup rules.
   */
  private resolveCustomerUnitPrice({
    supplierUnitCost,
    explicitCustomerUnitPrice,
    suggestedCustomerPrice,
    markupType,
    markupValue,
    lineNumber,
  }: {
    supplierUnitCost: Prisma.Decimal;
    explicitCustomerUnitPrice?: number;
    suggestedCustomerPrice?: Prisma.Decimal | null;
    markupType: SupplierMarkupType;
    markupValue: Prisma.Decimal | null;
    lineNumber: number;
  }): Prisma.Decimal {
    if (explicitCustomerUnitPrice !== undefined) {
      return this.normalizeRequiredMoney(
        explicitCustomerUnitPrice,
        `Precio cliente de la línea ${lineNumber}`,
      );
    }

    if (
      suggestedCustomerPrice &&
      markupType === SupplierMarkupType.MANUAL_PRICE
    ) {
      return suggestedCustomerPrice.toDecimalPlaces(2);
    }

    if (markupType === SupplierMarkupType.NONE) {
      return supplierUnitCost.toDecimalPlaces(2);
    }

    if (markupType === SupplierMarkupType.PERCENTAGE) {
      const percentage = markupValue ?? new Prisma.Decimal(0);
      return supplierUnitCost
        .times(new Prisma.Decimal(1).plus(percentage.div(100)))
        .toDecimalPlaces(2);
    }

    if (markupType === SupplierMarkupType.FIXED_AMOUNT) {
      return supplierUnitCost.plus(markupValue ?? 0).toDecimalPlaces(2);
    }

    if (markupType === SupplierMarkupType.MANUAL_PRICE && markupValue) {
      return markupValue.toDecimalPlaces(2);
    }

    return supplierUnitCost.toDecimalPlaces(2);
  }

  /**
   * Normalizes the part name snapshot stored in the work order line.
   */
  private normalizePartLineName(
    value: string | undefined,
    lineNumber: number,
  ): string {
    const normalizedValue = value?.trim();

    if (!normalizedValue) {
      throw new BadRequestException(
        `El nombre del repuesto es obligatorio en la línea ${lineNumber}.`,
      );
    }

    if (normalizedValue.length > MAX_PART_LINE_NAME_LENGTH) {
      throw new BadRequestException(
        `El nombre del repuesto de la línea ${lineNumber} no puede superar ${MAX_PART_LINE_NAME_LENGTH} caracteres.`,
      );
    }

    return normalizedValue;
  }

  /**
   * Normalizes quantity for structured part lines.
   */
  private normalizePartLineQuantity(
    value: number | undefined,
    lineNumber: number,
  ): Prisma.Decimal {
    const quantity = value ?? 1;

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      quantity > MAX_PART_LINE_QUANTITY
    ) {
      throw new BadRequestException(
        `La cantidad de la línea ${lineNumber} debe ser mayor a 0 y menor a ${MAX_PART_LINE_QUANTITY}.`,
      );
    }

    return new Prisma.Decimal(quantity.toFixed(2));
  }

  /**
   * Normalizes a required money value for structured part lines.
   */
  private normalizeRequiredMoney(
    value: number | null | undefined,
    fieldName: string,
  ): Prisma.Decimal {
    if (value === undefined || value === null) {
      throw new BadRequestException(`${fieldName} es obligatorio.`);
    }

    if (!Number.isFinite(value) || value < 0 || value > MAX_MONEY_VALUE) {
      throw new BadRequestException(
        `${fieldName} debe ser un número entre 0 y ${MAX_MONEY_VALUE}.`,
      );
    }

    return new Prisma.Decimal(value.toFixed(2));
  }

  /**
   * Normalizes markup values according to the selected markup type.
   */
  private normalizeMarkupValue(
    value: number | null | undefined,
    markupType: SupplierMarkupType,
    lineNumber: number,
  ): Prisma.Decimal | null {
    if (markupType === SupplierMarkupType.NONE) {
      return null;
    }

    if (value === undefined || value === null) {
      return null;
    }

    if (!Number.isFinite(value) || value < 0 || value > MAX_MONEY_VALUE) {
      throw new BadRequestException(
        `El recargo de la línea ${lineNumber} debe ser un número válido.`,
      );
    }

    return new Prisma.Decimal(value.toFixed(2));
  }

  /**
   * Normalizes purchase date for structured part lines.
   */
  private normalizePurchasedAt(value: string, lineNumber: number): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        `La fecha de compra de la línea ${lineNumber} no es válida.`,
      );
    }

    return date;
  }

  /**
   * Converts a Prisma Decimal to a plain number when present.
   */
  private decimalToNumber(
    value: Prisma.Decimal | null | undefined,
  ): number | undefined {
    return value ? value.toNumber() : undefined;
  }

  /**
   * Validates and converts money values to Prisma Decimal.
   *
   * Undefined means "do not update". Null means "clear value".
   */
  private normalizeMoney(
    value: number | null | undefined,
    fieldName: string,
  ): Prisma.Decimal | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
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
   * Detail relation shape returned by the single work order endpoint.
   *
   * Events are intentionally included only in the detail view to keep list
   * queries lightweight.
   */
  private getDetailInclude() {
    return {
      ...this.getDefaultInclude(),
      partLines: {
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          supplierPart: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      events: {
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    } satisfies Prisma.WorkOrderInclude;
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
