import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma, WorkOrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { FindAppointmentsQueryDto } from './dto/find-appointments-query.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

const DEFAULT_APPOINTMENTS_PAGE = 1;
const DEFAULT_APPOINTMENTS_LIMIT = 10;
const MAX_SEARCH_LENGTH = 120;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_CANCEL_REASON_LENGTH = 800;

type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

type AppointmentLinksInput = {
  customerId?: string;
  vehicleId?: string;
  workOrderId?: string;
};

type ResolvedAppointmentLinks = {
  customerId: string | null;
  vehicleId: string | null;
  workOrderId: string | null;
};

/**
 * Handles workshop agenda persistence and operational status changes.
 *
 * The model is intentionally date-range based so it can support mobile agenda
 * lists now and calendar views later without redesigning the backend.
 */
@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns paginated appointments for the authenticated workshop.
   *
   * Search matches title, description, customer data, vehicle data and work
   * order number.
   */
  async findAll(workshopId: string, query: FindAppointmentsQueryDto = {}) {
    const page = query.page ?? DEFAULT_APPOINTMENTS_PAGE;
    const limit = query.limit ?? DEFAULT_APPOINTMENTS_LIMIT;
    const skip = (page - 1) * limit;
    const normalizedSearch = this.normalizeSearch(query.search);
    const searchedOrderNumber = this.parseOrderNumberSearch(normalizedSearch);

    const where: Prisma.AppointmentWhereInput = {
      workshopId,
      ...(query.status ? { status: query.status } : {}),
      ...this.buildDateRangeFilter(query.from, query.to),
      ...(normalizedSearch
        ? {
            OR: [
              {
                title: {
                  contains: normalizedSearch,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                description: {
                  contains: normalizedSearch,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                customer: {
                  fullName: {
                    contains: normalizedSearch,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
              {
                customer: {
                  phone: {
                    contains: normalizedSearch,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
              {
                vehicle: {
                  licensePlate: {
                    contains:
                      this.normalizeLicensePlateSearch(normalizedSearch) ??
                      normalizedSearch,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
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
              ...(searchedOrderNumber
                ? [
                    {
                      workOrder: {
                        orderNumber: searchedOrderNumber,
                      },
                    },
                  ]
                : []),
            ],
          }
        : {}),
    };

    const [totalItems, data] = await this.prisma.$transaction([
      this.prisma.appointment.count({
        where,
      }),
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          scheduledStart: 'asc',
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
   * Returns one appointment if it belongs to the authenticated workshop.
   */
  async findOne(workshopId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        workshopId,
      },
      include: this.getDefaultInclude(),
    });

    if (!appointment) {
      throw new NotFoundException('Turno no encontrado.');
    }

    return appointment;
  }

  /**
   * Creates an appointment with optional customer, vehicle and work order links.
   *
   * Linked customers and vehicles must be active. If a vehicle or work order is
   * provided, the customer relation is inferred from that operational context.
   */
  async create(workshopId: string, dto: CreateAppointmentDto) {
    const schedule = this.normalizeSchedule(
      dto.scheduledStart,
      dto.scheduledEnd,
    );
    const links = await this.resolveAppointmentLinks(workshopId, {
      customerId: dto.customerId,
      vehicleId: dto.vehicleId,
      workOrderId: dto.workOrderId,
    });

    return this.prisma.appointment.create({
      data: {
        workshopId,
        customerId: links.customerId,
        vehicleId: links.vehicleId,
        workOrderId: links.workOrderId,
        title: this.normalizeRequiredText(
          dto.title,
          'Título del turno',
          MAX_TITLE_LENGTH,
        ),
        description: this.normalizeNullableMultilineText(
          dto.description,
          'Descripción',
          MAX_DESCRIPTION_LENGTH,
        ),
        scheduledStart: schedule.scheduledStart,
        scheduledEnd: schedule.scheduledEnd,
      },
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Updates an operational appointment.
   */
  async update(workshopId: string, id: string, dto: UpdateAppointmentDto) {
    const currentAppointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        workshopId,
      },
      select: {
        id: true,
        customerId: true,
        vehicleId: true,
        workOrderId: true,
        scheduledStart: true,
        scheduledEnd: true,
        status: true,
      },
    });

    if (!currentAppointment) {
      throw new NotFoundException('Turno no encontrado.');
    }

    if (currentAppointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Un turno completado no puede editarse.');
    }

    if (currentAppointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Un turno cancelado no puede editarse.');
    }

    const scheduledStart = dto.scheduledStart
      ? this.parseRequiredDate(dto.scheduledStart, 'Inicio del turno')
      : currentAppointment.scheduledStart;
    const scheduledEnd = dto.scheduledEnd
      ? this.parseRequiredDate(dto.scheduledEnd, 'Fin del turno')
      : currentAppointment.scheduledEnd;

    this.assertValidSchedule(scheduledStart, scheduledEnd);

    const shouldResolveLinks =
      dto.customerId !== undefined ||
      dto.vehicleId !== undefined ||
      dto.workOrderId !== undefined;

    const links = shouldResolveLinks
      ? await this.resolveAppointmentLinks(workshopId, {
          customerId:
            dto.customerId ??
            (dto.vehicleId !== undefined || dto.workOrderId !== undefined
              ? undefined
              : (currentAppointment.customerId ?? undefined)),
          vehicleId:
            dto.vehicleId ??
            (dto.workOrderId !== undefined
              ? undefined
              : (currentAppointment.vehicleId ?? undefined)),
          workOrderId:
            dto.workOrderId ?? currentAppointment.workOrderId ?? undefined,
        })
      : null;

    return this.prisma.appointment.update({
      where: {
        id: currentAppointment.id,
      },
      data: {
        title:
          dto.title !== undefined
            ? this.normalizeRequiredText(
                dto.title,
                'Título del turno',
                MAX_TITLE_LENGTH,
              )
            : undefined,
        description: this.normalizeOptionalNullableMultilineText(
          dto.description,
          'Descripción',
          MAX_DESCRIPTION_LENGTH,
        ),
        scheduledStart,
        scheduledEnd,
        customerId: links?.customerId,
        vehicleId: links?.vehicleId,
        workOrderId: links?.workOrderId,
      },
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Confirms a scheduled appointment.
   */
  async confirm(workshopId: string, id: string) {
    const appointment = await this.findOne(workshopId, id);

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Un turno cancelado no puede confirmarse.');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException(
        'Un turno completado no puede confirmarse.',
      );
    }

    return this.prisma.appointment.update({
      where: {
        id: appointment.id,
      },
      data: {
        status: AppointmentStatus.CONFIRMED,
      },
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Completes an appointment.
   */
  async complete(workshopId: string, id: string) {
    const appointment = await this.findOne(workshopId, id);

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Un turno cancelado no puede completarse.');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Este turno ya está completado.');
    }

    return this.prisma.appointment.update({
      where: {
        id: appointment.id,
      },
      data: {
        status: AppointmentStatus.COMPLETED,
        completedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null,
      },
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Cancels an appointment with a mandatory operational reason.
   */
  async cancel(workshopId: string, id: string, dto: CancelAppointmentDto) {
    const appointment = await this.findOne(workshopId, id);

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Un turno completado no puede cancelarse.');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Este turno ya está cancelado.');
    }

    return this.prisma.appointment.update({
      where: {
        id: appointment.id,
      },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancellationReason: this.normalizeRequiredText(
          dto.reason,
          'Motivo de cancelación',
          MAX_CANCEL_REASON_LENGTH,
        ),
        cancelledAt: new Date(),
        completedAt: null,
      },
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Resolves and validates optional operational links.
   */
  private async resolveAppointmentLinks(
    workshopId: string,
    input: AppointmentLinksInput,
  ): Promise<ResolvedAppointmentLinks> {
    let resolvedCustomerId = input.customerId ?? null;
    let resolvedVehicleId = input.vehicleId ?? null;
    let resolvedWorkOrderId = input.workOrderId ?? null;

    if (input.workOrderId) {
      const workOrder = await this.prisma.workOrder.findFirst({
        where: {
          id: input.workOrderId,
          workshopId,
        },
        select: {
          id: true,
          status: true,
          vehicle: {
            select: {
              id: true,
              customerId: true,
              archivedAt: true,
              customer: {
                select: {
                  archivedAt: true,
                },
              },
            },
          },
        },
      });

      if (!workOrder) {
        throw new NotFoundException('Orden de trabajo no encontrada.');
      }

      if (workOrder.status === WorkOrderStatus.CANCELLED) {
        throw new ConflictException(
          'No se puede vincular un turno a una orden anulada.',
        );
      }

      if (workOrder.vehicle.archivedAt) {
        throw new ConflictException(
          'No se puede agendar sobre un vehículo archivado.',
        );
      }

      if (workOrder.vehicle.customer.archivedAt) {
        throw new ConflictException(
          'No se puede agendar sobre un cliente archivado.',
        );
      }

      if (resolvedVehicleId && resolvedVehicleId !== workOrder.vehicle.id) {
        throw new BadRequestException(
          'La orden seleccionada no pertenece al vehículo indicado.',
        );
      }

      if (
        resolvedCustomerId &&
        resolvedCustomerId !== workOrder.vehicle.customerId
      ) {
        throw new BadRequestException(
          'La orden seleccionada no pertenece al cliente indicado.',
        );
      }

      resolvedWorkOrderId = workOrder.id;
      resolvedVehicleId = workOrder.vehicle.id;
      resolvedCustomerId = workOrder.vehicle.customerId;
    }

    if (input.vehicleId) {
      const vehicle = await this.prisma.vehicle.findFirst({
        where: {
          id: input.vehicleId,
          workshopId,
        },
        select: {
          id: true,
          customerId: true,
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
          'No se puede agendar sobre un vehículo archivado.',
        );
      }

      if (vehicle.customer.archivedAt) {
        throw new ConflictException(
          'No se puede agendar sobre un cliente archivado.',
        );
      }

      if (resolvedCustomerId && resolvedCustomerId !== vehicle.customerId) {
        throw new BadRequestException(
          'El vehículo seleccionado no pertenece al cliente indicado.',
        );
      }

      resolvedVehicleId = vehicle.id;
      resolvedCustomerId = vehicle.customerId;
    }

    if (resolvedCustomerId) {
      const customer = await this.prisma.customer.findFirst({
        where: {
          id: resolvedCustomerId,
          workshopId,
        },
        select: {
          id: true,
          archivedAt: true,
        },
      });

      if (!customer) {
        throw new NotFoundException('Cliente no encontrado.');
      }

      if (customer.archivedAt) {
        throw new ConflictException(
          'No se puede agendar sobre un cliente archivado.',
        );
      }

      resolvedCustomerId = customer.id;
    }

    return {
      customerId: resolvedCustomerId,
      vehicleId: resolvedVehicleId,
      workOrderId: resolvedWorkOrderId,
    };
  }

  /**
   * Builds a range filter that returns appointments overlapping the requested
   * period.
   */
  private buildDateRangeFilter(
    from?: string,
    to?: string,
  ): Prisma.AppointmentWhereInput {
    const fromDate = this.parseOptionalDate(from, 'Fecha desde');
    const toDate = this.parseOptionalDate(to, 'Fecha hasta');

    if (fromDate && toDate && fromDate >= toDate) {
      throw new BadRequestException(
        'La fecha desde debe ser anterior a la fecha hasta.',
      );
    }

    if (fromDate && toDate) {
      return {
        scheduledStart: {
          lt: toDate,
        },
        scheduledEnd: {
          gt: fromDate,
        },
      };
    }

    if (fromDate) {
      return {
        scheduledEnd: {
          gte: fromDate,
        },
      };
    }

    if (toDate) {
      return {
        scheduledStart: {
          lt: toDate,
        },
      };
    }

    return {};
  }

  /**
   * Normalizes a complete appointment schedule.
   */
  private normalizeSchedule(scheduledStart: string, scheduledEnd: string) {
    const parsedStart = this.parseRequiredDate(
      scheduledStart,
      'Inicio del turno',
    );
    const parsedEnd = this.parseRequiredDate(scheduledEnd, 'Fin del turno');

    this.assertValidSchedule(parsedStart, parsedEnd);

    return {
      scheduledStart: parsedStart,
      scheduledEnd: parsedEnd,
    };
  }

  /**
   * Ensures the appointment has a valid positive duration.
   */
  private assertValidSchedule(scheduledStart: Date, scheduledEnd: Date): void {
    if (scheduledStart >= scheduledEnd) {
      throw new BadRequestException(
        'El fin del turno debe ser posterior al inicio.',
      );
    }
  }

  /**
   * Parses a required ISO date.
   */
  private parseRequiredDate(value: string, fieldName: string): Date {
    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`${fieldName} no tiene una fecha válida.`);
    }

    return parsedDate;
  }

  /**
   * Parses an optional ISO date.
   */
  private parseOptionalDate(
    value: string | undefined,
    fieldName: string,
  ): Date | undefined {
    if (!value) {
      return undefined;
    }

    return this.parseRequiredDate(value, fieldName);
  }

  /**
   * Normalizes search text and caps it to keep queries predictable.
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
   * Parses an exact numeric work order number from search.
   */
  private parseOrderNumberSearch(search?: string): number | undefined {
    if (!search || !/^\d+$/u.test(search)) {
      return undefined;
    }

    const orderNumber = Number(search);

    return Number.isSafeInteger(orderNumber) ? orderNumber : undefined;
  }

  /**
   * Normalizes required short text fields.
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
   * Normalizes nullable multiline text on create operations.
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
   * Default relation shape returned by appointment endpoints.
   */
  private getDefaultInclude() {
    return {
      customer: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          archivedAt: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          licensePlate: true,
          brand: true,
          model: true,
          year: true,
          mileage: true,
          archivedAt: true,
          customer: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              archivedAt: true,
            },
          },
        },
      },
      workOrder: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
        },
      },
    } satisfies Prisma.AppointmentInclude;
  }
}
