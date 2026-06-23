import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WorkOrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { FindVehiclesQueryDto } from './dto/find-vehicles-query.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

const MIN_VEHICLE_YEAR = 1900;
const MAX_MILEAGE = 2000000;
const MAX_TEXT_LENGTH = 80;
const MAX_NOTES_LENGTH = 800;
const NORMALIZED_LICENSE_PLATE_PATTERN = /^[A-Z0-9]{5,10}$/;
const DEFAULT_VEHICLES_PAGE = 1;
const DEFAULT_VEHICLES_LIMIT = 10;

const ACTIVE_WORK_ORDER_STATUSES = new Set<WorkOrderStatus>([
  WorkOrderStatus.PENDING,
  WorkOrderStatus.IN_PROGRESS,
  WorkOrderStatus.READY,
]);

const CLOSED_WORK_ORDER_STATUSES = new Set<WorkOrderStatus>([
  WorkOrderStatus.DELIVERED,
  WorkOrderStatus.CANCELLED,
]);

type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

type VehicleSearchTerms = {
  text: string;
  normalizedLicensePlate?: string;
  formattedPhone?: string;
};

/**
 * Returns true when a work order is still part of the operational flow.
 */
function isActiveWorkOrderStatus(status: WorkOrderStatus): boolean {
  return ACTIVE_WORK_ORDER_STATUSES.has(status);
}

/**
 * Returns true when a work order is closed and should be treated as history.
 */
function isClosedWorkOrderStatus(status: WorkOrderStatus): boolean {
  return CLOSED_WORK_ORDER_STATUSES.has(status);
}

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
   * Returns paginated vehicles for the authenticated user's workshop.
   *
   * Search matches license plate, brand, model, customer name or customer phone.
   */
  async findAll(workshopId: string, query: FindVehiclesQueryDto = {}) {
    const page = query.page ?? DEFAULT_VEHICLES_PAGE;
    const limit = query.limit ?? DEFAULT_VEHICLES_LIMIT;
    const skip = (page - 1) * limit;
    const searchTerms = this.normalizeSearch(query.search);

    const where: Prisma.VehicleWhereInput = {
      workshopId,
      ...(searchTerms
        ? {
            OR: this.buildVehicleSearchConditions(searchTerms),
          }
        : {}),
    };

    const [totalItems, data] = await this.prisma.$transaction([
      this.prisma.vehicle.count({
        where,
      }),
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
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
   * Returns one vehicle if it belongs to the authenticated user's workshop.
   */
  async findOne(workshopId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id,
        workshopId,
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
      throw new NotFoundException('Vehículo no encontrado.');
    }

    return vehicle;
  }

  /**
   * Returns the complete operational vehicle profile.
   *
   * This endpoint feeds the vehicle profile page, including customer data,
   * active work orders, historical work orders and a compact summary.
   */
  async findProfile(workshopId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id,
        workshopId,
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
      throw new NotFoundException('Vehículo no encontrado.');
    }

    const activeWorkOrders = vehicle.workOrders.filter((workOrder) =>
      isActiveWorkOrderStatus(workOrder.status),
    );

    const history = vehicle.workOrders.filter((workOrder) =>
      isClosedWorkOrderStatus(workOrder.status),
    );

    const deliveredWorkOrders = history.filter(
      (workOrder) => workOrder.status === WorkOrderStatus.DELIVERED,
    );

    const cancelledWorkOrders = history.filter(
      (workOrder) => workOrder.status === WorkOrderStatus.CANCELLED,
    );

    const latestWorkOrder = vehicle.workOrders[0] ?? null;
    const latestActiveWorkOrder = activeWorkOrders[0] ?? null;
    const latestClosedWorkOrder = history[0] ?? null;

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
        closedWorkOrders: history.length,
        deliveredWorkOrders: deliveredWorkOrders.length,
        cancelledWorkOrders: cancelledWorkOrders.length,
        latestWorkOrder,
        latestActiveWorkOrder,
        latestClosedWorkOrder,
      },
    };
  }

  /**
   * Creates a vehicle associated with an existing customer from the same workshop.
   */
  async create(workshopId: string, dto: CreateVehicleDto) {
    const normalizedLicensePlate = this.normalizeLicensePlate(dto.licensePlate);

    await this.ensureCustomerBelongsToWorkshop(workshopId, dto.customerId);
    await this.ensureLicensePlateIsAvailable(
      workshopId,
      normalizedLicensePlate,
    );

    try {
      return await this.prisma.vehicle.create({
        data: {
          workshopId,
          customerId: dto.customerId,
          licensePlate: normalizedLicensePlate,
          brand: this.normalizeRequiredText(dto.brand, 'Marca'),
          model: this.normalizeRequiredText(dto.model, 'Modelo'),
          year: this.normalizeYear(dto.year),
          mileage: this.normalizeMileage(dto.mileage),
          notes: this.normalizeNullableMultilineText(dto.notes, 'Notas'),
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
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  /**
   * Updates a vehicle if it belongs to the authenticated user's workshop.
   */
  async update(workshopId: string, id: string, dto: UpdateVehicleDto) {
    const currentVehicle = await this.findOne(workshopId, id);
    const normalizedLicensePlate = dto.licensePlate
      ? this.normalizeLicensePlate(dto.licensePlate)
      : undefined;

    if (dto.customerId) {
      await this.ensureCustomerBelongsToWorkshop(workshopId, dto.customerId);
    }

    if (
      normalizedLicensePlate &&
      normalizedLicensePlate !== currentVehicle.licensePlate
    ) {
      await this.ensureLicensePlateIsAvailable(
        workshopId,
        normalizedLicensePlate,
        id,
      );
    }

    try {
      return await this.prisma.vehicle.update({
        where: {
          id,
        },
        data: {
          customerId: dto.customerId,
          licensePlate: normalizedLicensePlate,
          brand:
            dto.brand !== undefined
              ? this.normalizeRequiredText(dto.brand, 'Marca')
              : undefined,
          model:
            dto.model !== undefined
              ? this.normalizeRequiredText(dto.model, 'Modelo')
              : undefined,
          year: this.normalizeYear(dto.year),
          mileage: this.normalizeMileage(dto.mileage),
          notes: this.normalizeOptionalNullableMultilineText(
            dto.notes,
            'Notas',
          ),
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
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  /**
   * Builds Prisma search conditions for vehicle list filtering.
   */
  private buildVehicleSearchConditions(
    searchTerms: VehicleSearchTerms,
  ): Prisma.VehicleWhereInput[] {
    const conditions: Prisma.VehicleWhereInput[] = [
      {
        brand: {
          contains: searchTerms.text,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        model: {
          contains: searchTerms.text,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        customer: {
          fullName: {
            contains: searchTerms.text,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
      {
        customer: {
          phone: {
            contains: searchTerms.text,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
    ];

    if (searchTerms.normalizedLicensePlate) {
      conditions.push({
        licensePlate: {
          contains: searchTerms.normalizedLicensePlate,
          mode: Prisma.QueryMode.insensitive,
        },
      });
    }

    if (
      searchTerms.formattedPhone &&
      searchTerms.formattedPhone !== searchTerms.text
    ) {
      conditions.push({
        customer: {
          phone: {
            contains: searchTerms.formattedPhone,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      });
    }

    return conditions;
  }

  /**
   * Ensures the customer exists inside the authenticated user's workshop.
   */
  private async ensureCustomerBelongsToWorkshop(
    workshopId: string,
    customerId: string,
  ): Promise<void> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        workshopId,
      },
      select: {
        id: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado.');
    }
  }

  /**
   * Prevents duplicated license plates inside the same workshop.
   */
  private async ensureLicensePlateIsAvailable(
    workshopId: string,
    normalizedLicensePlate: string,
    currentVehicleId?: string,
  ): Promise<void> {
    const existingVehicle = await this.prisma.vehicle.findFirst({
      where: {
        workshopId,
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
      throw new ConflictException(
        'Ya existe un vehículo con esa patente en este taller.',
      );
    }
  }

  /**
   * Normalizes and validates license plates to avoid duplicates caused by
   * casing, spaces or hyphens.
   */
  private normalizeLicensePlate(licensePlate: string): string {
    const rawLicensePlate = licensePlate.trim().toUpperCase();

    if (!/^(?=.*[A-Z0-9])[A-Z0-9\s-]+$/.test(rawLicensePlate)) {
      throw new BadRequestException(
        'La patente solo puede contener letras, números, espacios o guiones.',
      );
    }

    const normalizedLicensePlate = rawLicensePlate.replace(/[\s-]/g, '');

    if (!NORMALIZED_LICENSE_PLATE_PATTERN.test(normalizedLicensePlate)) {
      throw new BadRequestException(
        'La patente debe tener entre 5 y 10 caracteres alfanuméricos.',
      );
    }

    return normalizedLicensePlate;
  }

  /**
   * Normalizes search text and adds plate/phone-friendly variants.
   */
  private normalizeSearch(search?: string): VehicleSearchTerms | undefined {
    const normalizedSearch = search?.trim().replace(/\s+/g, ' ');

    if (!normalizedSearch) {
      return undefined;
    }

    const text = normalizedSearch.slice(0, MAX_TEXT_LENGTH);
    const normalizedLicensePlate = this.normalizeLicensePlateSearch(text);
    const digits = text.replace(/\D/g, '');
    const formattedPhone =
      digits.length > 4
        ? `${digits.slice(0, 4)} ${digits.slice(4)}`
        : undefined;

    return {
      text,
      normalizedLicensePlate,
      formattedPhone,
    };
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
   * Normalizes required text fields and rejects blank values.
   */
  private normalizeRequiredText(value: string, fieldName: string): string {
    const normalizedValue = value.trim().replace(/\s+/g, ' ');

    if (!normalizedValue) {
      throw new BadRequestException(`${fieldName} es obligatorio.`);
    }

    if (normalizedValue.length > MAX_TEXT_LENGTH) {
      throw new BadRequestException(
        `${fieldName} no puede superar ${MAX_TEXT_LENGTH} caracteres.`,
      );
    }

    return normalizedValue;
  }

  /**
   * Normalizes nullable multiline text on create operations.
   *
   * It preserves line breaks because vehicle notes are stored as one item per
   * line by the shared NotesEditor component.
   */
  private normalizeNullableMultilineText(
    value: string | null | undefined,
    fieldName: string,
  ): string | null {
    const normalizedValue = this.normalizeOptionalNullableMultilineText(
      value,
      fieldName,
    );

    return normalizedValue ?? null;
  }

  /**
   * Normalizes optional nullable multiline text on update operations.
   *
   * Undefined means "do not update". Null or blank means "clear value".
   * Line breaks are preserved so structured notes keep one item per row.
   */
  private normalizeOptionalNullableMultilineText(
    value: string | null | undefined,
    fieldName: string,
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

    if (normalizedValue.length > MAX_NOTES_LENGTH) {
      throw new BadRequestException(
        `${fieldName} no puede superar ${MAX_NOTES_LENGTH} caracteres.`,
      );
    }

    return normalizedValue;
  }

  /**
   * Validates vehicle year against the current year plus one.
   */
  private normalizeYear(year: number | undefined): number | undefined {
    if (year === undefined) {
      return undefined;
    }

    const maxAllowedYear = new Date().getFullYear() + 1;

    if (year < MIN_VEHICLE_YEAR || year > maxAllowedYear) {
      throw new BadRequestException(
        `El año debe estar entre ${MIN_VEHICLE_YEAR} y ${maxAllowedYear}.`,
      );
    }

    return year;
  }

  /**
   * Validates vehicle mileage.
   */
  private normalizeMileage(mileage: number | undefined): number | undefined {
    if (mileage === undefined) {
      return undefined;
    }

    if (mileage < 0 || mileage > MAX_MILEAGE) {
      throw new BadRequestException(
        `El kilometraje debe estar entre 0 y ${MAX_MILEAGE}.`,
      );
    }

    return mileage;
  }

  /**
   * Converts Prisma write errors into safe API exceptions.
   */
  private handlePrismaWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Ya existe un vehículo con esa patente en este taller.',
        );
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('Vehículo no encontrado.');
      }
    }

    throw error;
  }
}
