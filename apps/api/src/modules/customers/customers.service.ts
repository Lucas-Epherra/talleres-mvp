import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AppointmentStatus,
  CustomerEventType,
  Prisma,
  WorkOrderStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ArchiveCustomerDto } from './dto/archive-customer.dto';
import {
  CustomerArchiveStatus,
  FindCustomersQueryDto,
} from './dto/find-customers-query.dto';
import { RestoreCustomerDto } from './dto/restore-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

const DEFAULT_CUSTOMERS_PAGE = 1;
const DEFAULT_CUSTOMERS_LIMIT = 10;

const ACTIVE_WORK_ORDER_STATUSES = [
  WorkOrderStatus.PENDING,
  WorkOrderStatus.IN_PROGRESS,
  WorkOrderStatus.READY,
] as const satisfies readonly WorkOrderStatus[];

type NormalizedCustomerCreateData = {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
};

type NormalizedCustomerUpdateData = {
  fullName?: string;
  phone?: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
};

type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

type CustomerSearchTerms = {
  text: string;
  formattedPhone?: string;
};

/**
 * Handles customer persistence and lookup operations.
 *
 * Every query is scoped by workshopId to keep the backend compatible with a
 * multi-tenant SaaS model.
 */
@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns paginated customers for the provided workshop.
   *
   * Search matches customer name, phone, email, address or internal notes.
   */
  async findAll(workshopId: string, query: FindCustomersQueryDto = {}) {
    const page = query.page ?? DEFAULT_CUSTOMERS_PAGE;
    const limit = query.limit ?? DEFAULT_CUSTOMERS_LIMIT;
    const skip = (page - 1) * limit;
    const searchTerms = normalizeSearch(query.search);

    const where: Prisma.CustomerWhereInput = {
      workshopId,
      ...buildCustomerArchiveFilter(query.archiveStatus),
      ...(searchTerms
        ? {
            OR: buildCustomerSearchConditions(searchTerms),
          }
        : {}),
    };

    const [totalItems, data] = await this.prisma.$transaction([
      this.prisma.customer.count({
        where,
      }),
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: {
            select: {
              vehicles: true,
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
   * Returns one customer if it belongs to the provided workshop.
   */
  async findOne(workshopId: string, id: string) {
    const now = new Date();

    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        workshopId,
      },
      select: {
        id: true,
        workshopId: true,
        fullName: true,
        phone: true,
        email: true,
        address: true,
        notes: true,
        archivedAt: true,
        archivedReason: true,
        archivedByUserId: true,
        createdAt: true,
        updatedAt: true,
        vehicles: {
          orderBy: [
            {
              archivedAt: 'asc',
            },
            {
              createdAt: 'desc',
            },
          ],
          select: {
            id: true,
            workshopId: true,
            customerId: true,
            licensePlate: true,
            brand: true,
            model: true,
            year: true,
            mileage: true,
            notes: true,
            archivedAt: true,
            archivedReason: true,
            archivedByUserId: true,
            createdAt: true,
            updatedAt: true,
            appointments: {
              where: {
                scheduledEnd: {
                  gte: now,
                },
                status: {
                  in: [
                    AppointmentStatus.SCHEDULED,
                    AppointmentStatus.CONFIRMED,
                  ],
                },
              },
              orderBy: {
                scheduledStart: 'asc',
              },
              take: 3,
              select: {
                id: true,
                title: true,
                description: true,
                scheduledStart: true,
                scheduledEnd: true,
                status: true,
                vehicleId: true,
                workOrderId: true,
              },
            },
            workOrders: {
              orderBy: [
                {
                  entryDate: 'desc',
                },
                {
                  orderNumber: 'desc',
                },
              ],
              take: 20,
              select: {
                id: true,
                workshopId: true,
                vehicleId: true,
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
                receipts: {
                  orderBy: {
                    issuedAt: 'desc',
                  },
                  select: {
                    id: true,
                    receiptNumber: true,
                    issuedAt: true,
                    total: true,
                    emailTo: true,
                    emailedAt: true,
                  },
                },
              },
            },
          },
        },
        appointments: {
          where: {
            scheduledEnd: {
              gte: now,
            },
            status: {
              in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
            },
          },
          orderBy: {
            scheduledStart: 'asc',
          },
          take: 5,
          select: {
            id: true,
            title: true,
            description: true,
            scheduledStart: true,
            scheduledEnd: true,
            status: true,
            vehicleId: true,
            workOrderId: true,
            vehicle: {
              select: {
                id: true,
                licensePlate: true,
                brand: true,
                model: true,
              },
            },
            workOrder: {
              select: {
                id: true,
                orderNumber: true,
                status: true,
              },
            },
          },
        },
        events: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          select: {
            id: true,
            type: true,
            description: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return customer;
  }

  /**
   * Creates a customer inside the provided workshop.
   */
  async create(workshopId: string, dto: CreateCustomerDto) {
    const data = normalizeCreateCustomerData(dto);

    await this.assertPhoneIsAvailable(workshopId, data.phone);

    try {
      return await this.prisma.customer.create({
        data: {
          workshopId,
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          address: data.address,
          notes: data.notes,
        },
      });
    } catch (error) {
      handleCustomerWriteError(error);
    }
  }

  /**
   * Updates a customer if it belongs to the provided workshop.
   */
  async update(workshopId: string, id: string, dto: UpdateCustomerDto) {
    await this.findOne(workshopId, id);

    const data = normalizeUpdateCustomerData(dto);

    if (data.phone) {
      await this.assertPhoneIsAvailable(workshopId, data.phone, id);
    }

    try {
      return await this.prisma.customer.update({
        where: {
          id,
        },
        data,
      });
    } catch (error) {
      handleCustomerWriteError(error);
    }
  }

  /**
   * Archives a customer with audit trail.
   *
   * Customers with active work orders across any associated vehicle cannot be
   * archived because that would hide operational work still in progress.
   */
  async archive(
    workshopId: string,
    id: string,
    userId: string,
    dto: ArchiveCustomerDto,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        workshopId,
      },
      select: {
        id: true,
        archivedAt: true,
        vehicles: {
          select: {
            id: true,
            licensePlate: true,
            workOrders: {
              where: {
                status: {
                  in: [...ACTIVE_WORK_ORDER_STATUSES],
                },
              },
              select: {
                id: true,
                orderNumber: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado.');
    }

    if (customer.archivedAt) {
      throw new BadRequestException('El cliente ya está archivado.');
    }

    const activeWorkOrdersCount = customer.vehicles.reduce(
      (total, vehicle) => total + vehicle.workOrders.length,
      0,
    );

    if (activeWorkOrdersCount > 0) {
      throw new ConflictException(
        'No se puede archivar un cliente con órdenes activas.',
      );
    }

    const reason = normalizeRequiredMultilineText(
      dto.reason,
      'Motivo de archivado',
    );
    const archivedAt = new Date();

    await this.prisma.$transaction([
      this.prisma.customer.update({
        where: {
          id: customer.id,
        },
        data: {
          archivedAt,
          archivedReason: reason,
          archivedByUserId: userId,
        },
      }),
      this.prisma.customerEvent.create({
        data: {
          workshopId,
          customerId: customer.id,
          userId,
          type: CustomerEventType.ARCHIVED,
          description: reason,
        },
      }),
    ]);

    return this.findOne(workshopId, id);
  }

  /**
   * Restores an archived customer with audit trail.
   */
  async restore(
    workshopId: string,
    id: string,
    userId: string,
    dto: RestoreCustomerDto,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
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

    if (!customer.archivedAt) {
      throw new BadRequestException('El cliente no está archivado.');
    }

    const reason = normalizeRequiredMultilineText(
      dto.reason,
      'Motivo de restauración',
    );

    await this.prisma.$transaction([
      this.prisma.customer.update({
        where: {
          id: customer.id,
        },
        data: {
          archivedAt: null,
          archivedReason: null,
          archivedByUserId: null,
        },
      }),
      this.prisma.customerEvent.create({
        data: {
          workshopId,
          customerId: customer.id,
          userId,
          type: CustomerEventType.RESTORED,
          description: reason,
        },
      }),
    ]);

    return this.findOne(workshopId, id);
  }

  /**
   * Ensures phone uniqueness inside one workshop.
   */
  private async assertPhoneIsAvailable(
    workshopId: string,
    phone: string,
    ignoredCustomerId?: string,
  ) {
    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        workshopId,
        phone,
        ...(ignoredCustomerId
          ? {
              NOT: {
                id: ignoredCustomerId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (existingCustomer) {
      throw new ConflictException(
        'Ya existe un cliente con ese teléfono en este taller.',
      );
    }
  }
}

/**
 * Builds Prisma search conditions for customer list filtering.
 */
function buildCustomerSearchConditions(
  searchTerms: CustomerSearchTerms,
): Prisma.CustomerWhereInput[] {
  const conditions: Prisma.CustomerWhereInput[] = [
    {
      fullName: {
        contains: searchTerms.text,
        mode: Prisma.QueryMode.insensitive,
      },
    },
    {
      phone: {
        contains: searchTerms.text,
        mode: Prisma.QueryMode.insensitive,
      },
    },
    {
      email: {
        contains: searchTerms.text,
        mode: Prisma.QueryMode.insensitive,
      },
    },
    {
      address: {
        contains: searchTerms.text,
        mode: Prisma.QueryMode.insensitive,
      },
    },
    {
      notes: {
        contains: searchTerms.text,
        mode: Prisma.QueryMode.insensitive,
      },
    },
  ];

  if (
    searchTerms.formattedPhone &&
    searchTerms.formattedPhone !== searchTerms.text
  ) {
    conditions.push({
      phone: {
        contains: searchTerms.formattedPhone,
        mode: Prisma.QueryMode.insensitive,
      },
    });
  }

  return conditions;
}

/**
 * Builds the archive filter used by the customers list endpoint.
 */
function buildCustomerArchiveFilter(
  archiveStatus?: CustomerArchiveStatus,
): Prisma.CustomerWhereInput {
  if (archiveStatus === 'all') {
    return {};
  }

  if (archiveStatus === 'archived') {
    return {
      archivedAt: {
        not: null,
      },
    };
  }

  return {
    archivedAt: null,
  };
}

/**
 * Normalizes create payload before persistence.
 */
function normalizeCreateCustomerData(
  dto: CreateCustomerDto,
): NormalizedCustomerCreateData {
  return {
    fullName: normalizeRequiredText(dto.fullName, 'El nombre del cliente'),
    phone: normalizeRequiredArgentinePhone(dto.phone),
    email: normalizeOptionalEmail(dto.email) ?? undefined,
    address: normalizeOptionalText(dto.address) ?? undefined,
    notes: normalizeOptionalMultilineText(dto.notes) ?? undefined,
  };
}

/**
 * Normalizes update payload before persistence.
 */
function normalizeUpdateCustomerData(
  dto: UpdateCustomerDto,
): NormalizedCustomerUpdateData {
  const data: NormalizedCustomerUpdateData = {};

  if (dto.fullName !== undefined) {
    data.fullName = normalizeRequiredText(
      dto.fullName,
      'El nombre del cliente',
    );
  }

  if (dto.phone !== undefined) {
    data.phone = normalizeRequiredArgentinePhone(dto.phone);
  }

  if (dto.email !== undefined) {
    data.email = normalizeOptionalEmail(dto.email);
  }

  if (dto.address !== undefined) {
    data.address = normalizeOptionalText(dto.address);
  }

  if (dto.notes !== undefined) {
    data.notes = normalizeOptionalMultilineText(dto.notes);
  }

  return data;
}

/**
 * Normalizes required short text fields.
 */
function normalizeRequiredText(value: string, label: string): string {
  const normalizedValue = normalizeHumanText(value);

  if (!normalizedValue) {
    throw new BadRequestException(`${label} es obligatorio.`);
  }

  return normalizedValue;
}

/**
 * Normalizes optional short text fields.
 */
function normalizeOptionalText(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  const normalizedValue = normalizeHumanText(value);

  return normalizedValue.length > 0 ? normalizedValue : null;
}

/**
 * Normalizes optional multiline text fields.
 *
 * Undefined or null clears the value in create/update flows. Line breaks are
 * preserved so internal notes keep one item per row.
 */
function normalizeOptionalMultilineText(
  value: string | null | undefined,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalizedValue = value
    .split(/\r?\n/u)
    .map((line) => normalizeHumanText(line))
    .filter(Boolean)
    .join('\n');

  return normalizedValue.length > 0 ? normalizedValue : null;
}

/**
 * Normalizes required multiline text for critical operational reasons.
 */
function normalizeRequiredMultilineText(value: string, label: string): string {
  const normalizedValue = normalizeOptionalMultilineText(value);

  if (!normalizedValue) {
    throw new BadRequestException(`${label} es obligatorio.`);
  }

  return normalizedValue;
}

/**
 * Normalizes optional email values.
 */
function normalizeOptionalEmail(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  return normalizedValue.length > 0 ? normalizedValue : null;
}

/**
 * Parses and normalizes Argentinian phone numbers.
 *
 * Accepted examples:
 * 2983654321
 * 2983 654321
 * 02983 654321
 * +54 2983 654321
 *
 * Stored format:
 * 2983 654321
 */
function normalizeRequiredArgentinePhone(value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new BadRequestException('El teléfono del cliente es obligatorio.');
  }

  if (!/^[+\d\s().-]+$/.test(normalizedValue)) {
    throw new BadRequestException(
      'El teléfono solo puede contener números, espacios, guiones, paréntesis o prefijo +54.',
    );
  }

  let digits = normalizedValue.replace(/\D/g, '');

  if (digits.startsWith('549') && digits.length === 13) {
    digits = digits.slice(3);
  } else if (digits.startsWith('54') && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  if (digits.length !== 10) {
    throw new BadRequestException(
      'El teléfono debe tener 10 dígitos nacionales. Ejemplo válido: 2983 654321.',
    );
  }

  return `${digits.slice(0, 4)} ${digits.slice(4)}`;
}

/**
 * Collapses repeated spaces for short human-readable fields.
 */
function normalizeHumanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Normalizes customer search text and adds a phone-friendly variant.
 */
function normalizeSearch(search?: string): CustomerSearchTerms | undefined {
  const normalizedSearch = search?.trim();

  if (!normalizedSearch) {
    return undefined;
  }

  const digits = normalizedSearch.replace(/\D/g, '');
  const formattedPhone =
    digits.length > 4 ? `${digits.slice(0, 4)} ${digits.slice(4)}` : undefined;

  return {
    text: normalizedSearch,
    formattedPhone,
  };
}

/**
 * Converts Prisma write errors into safe HTTP errors.
 */
function handleCustomerWriteError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictException(
      'Ya existe un cliente con ese teléfono en este taller.',
    );
  }

  throw error;
}
