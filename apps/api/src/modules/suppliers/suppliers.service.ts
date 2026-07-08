import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SupplierEventType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ArchiveSupplierDto } from './dto/archive-supplier.dto';
import { CreateSupplierCategoryDto } from './dto/create-supplier-category.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { FindSupplierCategoriesQueryDto } from './dto/find-supplier-categories-query.dto';
import {
  type SupplierArchiveStatus,
  FindSuppliersQueryDto,
} from './dto/find-suppliers-query.dto';
import { RestoreSupplierDto } from './dto/restore-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

const DEFAULT_SUPPLIERS_PAGE = 1;
const DEFAULT_SUPPLIERS_LIMIT = 10;
const MAX_SEARCH_LENGTH = 120;

const DEFAULT_CATEGORIES_PAGE = 1;
const DEFAULT_CATEGORIES_LIMIT = 50;

type SuppliersPrismaClient = PrismaService | Prisma.TransactionClient;

type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

type SupplierMetrics = {
  purchasedTotal: number;
  paidTotal: number;
  pendingBalance: number;
  chargedToCustomerTotal: number;
  grossProfitTotal: number;
};

type NormalizedSupplierCreateData = {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  address?: string;
  notes?: string;
  categoryNames: string[];
};

type NormalizedSupplierUpdateData = {
  name?: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  taxId?: string | null;
  address?: string | null;
  notes?: string | null;
  categoryNames?: string[];
};

/**
 * Handles supplier persistence, financial summaries and audit events.
 *
 * Every operation is scoped by workshopId so supplier data is isolated per
 * workshop and can safely feed future reports.
 */
@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns paginated suppliers with aggregated purchases, payments and debt.
   */
  async findAll(workshopId: string, query: FindSuppliersQueryDto = {}) {
    const page = query.page ?? DEFAULT_SUPPLIERS_PAGE;
    const limit = query.limit ?? DEFAULT_SUPPLIERS_LIMIT;
    const skip = (page - 1) * limit;
    const normalizedSearch = normalizeSearch(query.search);

    const where: Prisma.SupplierWhereInput = {
      workshopId,
      ...buildSupplierArchiveFilter(query.archiveStatus),
      ...(normalizedSearch
        ? {
            OR: [
              {
                name: {
                  contains: normalizedSearch,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                contactName: {
                  contains: normalizedSearch,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                phone: {
                  contains: normalizedSearch,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                email: {
                  contains: normalizedSearch,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                taxId: {
                  contains: normalizedSearch,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                categoryAssignments: {
                  some: {
                    category: {
                      name: {
                        contains: normalizedSearch,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [totalItems, suppliers] = await this.prisma.$transaction([
      this.prisma.supplier.count({ where }),
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          updatedAt: 'desc',
        },
        include: this.getListInclude(),
      }),
    ]);

    const metricsBySupplierId = await this.buildSupplierMetricsMap(
      workshopId,
      suppliers.map((supplier) => supplier.id),
    );

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
      data: suppliers.map((supplier) =>
        mapSupplierForResponse(
          supplier,
          getSupplierMetrics(metricsBySupplierId, supplier.id),
        ),
      ),
      meta,
    };
  }

  /**
   * Returns one supplier profile with metrics and recent operational activity.
   */
  async findOne(workshopId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id,
        workshopId,
      },
      include: this.getDetailInclude(),
    });

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado.');
    }

    const metricsBySupplierId = await this.buildSupplierMetricsMap(workshopId, [
      supplier.id,
    ]);

    return mapSupplierForResponse(
      supplier,
      getSupplierMetrics(metricsBySupplierId, supplier.id),
    );
  }

  /**
   * Creates a supplier and optional category assignments.
   */
  async create(workshopId: string, userId: string, dto: CreateSupplierDto) {
    const data = normalizeCreateSupplierData(dto);

    try {
      const supplierId = await this.prisma.$transaction(async (tx) => {
        const supplier = await tx.supplier.create({
          data: {
            workshopId,
            name: data.name,
            contactName: data.contactName,
            phone: data.phone,
            email: data.email,
            taxId: data.taxId,
            address: data.address,
            notes: data.notes,
          },
          select: {
            id: true,
          },
        });

        await this.replaceSupplierCategories(
          tx,
          workshopId,
          supplier.id,
          data.categoryNames,
        );

        await this.createSupplierEvent(tx, {
          workshopId,
          supplierId: supplier.id,
          userId,
          type: SupplierEventType.CREATED,
          description: `Se creó el proveedor ${data.name}.`,
          metadata: {
            categoryNames: data.categoryNames,
          },
        });

        return supplier.id;
      });

      return this.findOne(workshopId, supplierId);
    } catch (error) {
      handleSupplierWriteError(error);
    }
  }

  /**
   * Updates supplier identity data and replaces categories when requested.
   */
  async update(
    workshopId: string,
    userId: string,
    id: string,
    dto: UpdateSupplierDto,
  ) {
    const currentSupplier = await this.ensureSupplierBelongsToWorkshop(
      workshopId,
      id,
    );

    if (currentSupplier.archivedAt) {
      throw new BadRequestException(
        'Un proveedor archivado no puede editarse. Restauralo primero.',
      );
    }

    const data = normalizeUpdateSupplierData(dto);

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.supplier.update({
          where: {
            id: currentSupplier.id,
          },
          data: {
            name: data.name,
            contactName: data.contactName,
            phone: data.phone,
            email: data.email,
            taxId: data.taxId,
            address: data.address,
            notes: data.notes,
          },
        });

        if (data.categoryNames !== undefined) {
          await this.replaceSupplierCategories(
            tx,
            workshopId,
            currentSupplier.id,
            data.categoryNames,
          );
        }

        await this.createSupplierEvent(tx, {
          workshopId,
          supplierId: currentSupplier.id,
          userId,
          type: SupplierEventType.UPDATED,
          description: `Se actualizó el proveedor ${data.name ?? currentSupplier.name}.`,
          metadata:
            data.categoryNames !== undefined
              ? {
                  categoryNames: data.categoryNames,
                }
              : undefined,
        });
      });

      return this.findOne(workshopId, id);
    } catch (error) {
      handleSupplierWriteError(error);
    }
  }

  /**
   * Archives a supplier without deleting historical purchases or payments.
   */
  async archive(
    workshopId: string,
    userId: string,
    id: string,
    dto: ArchiveSupplierDto,
  ) {
    const supplier = await this.ensureSupplierBelongsToWorkshop(workshopId, id);

    if (supplier.archivedAt) {
      throw new BadRequestException('El proveedor ya está archivado.');
    }

    const reason = normalizeRequiredMultilineText(
      dto.reason,
      'Motivo de archivado',
    );
    const archivedAt = new Date();

    await this.prisma.$transaction([
      this.prisma.supplier.update({
        where: {
          id: supplier.id,
        },
        data: {
          archivedAt,
          archivedReason: reason,
          archivedByUserId: userId,
        },
      }),
      this.prisma.supplierEvent.create({
        data: {
          workshopId,
          supplierId: supplier.id,
          userId,
          type: SupplierEventType.ARCHIVED,
          description: reason,
        },
      }),
    ]);

    return this.findOne(workshopId, id);
  }

  /**
   * Restores an archived supplier with audit trail.
   */
  async restore(
    workshopId: string,
    userId: string,
    id: string,
    dto: RestoreSupplierDto,
  ) {
    const supplier = await this.ensureSupplierBelongsToWorkshop(workshopId, id);

    if (!supplier.archivedAt) {
      throw new BadRequestException('El proveedor no está archivado.');
    }

    const reason = normalizeRequiredMultilineText(
      dto.reason,
      'Motivo de restauración',
    );

    await this.prisma.$transaction([
      this.prisma.supplier.update({
        where: {
          id: supplier.id,
        },
        data: {
          archivedAt: null,
          archivedReason: null,
          archivedByUserId: null,
        },
      }),
      this.prisma.supplierEvent.create({
        data: {
          workshopId,
          supplierId: supplier.id,
          userId,
          type: SupplierEventType.RESTORED,
          description: reason,
        },
      }),
    ]);

    return this.findOne(workshopId, id);
  }

  /**
   * Lists supplier categories for the authenticated workshop.
   */
  async findCategories(
    workshopId: string,
    query: FindSupplierCategoriesQueryDto = {},
  ) {
    const page = query.page ?? DEFAULT_CATEGORIES_PAGE;
    const limit = query.limit ?? DEFAULT_CATEGORIES_LIMIT;
    const skip = (page - 1) * limit;
    const normalizedSearch = normalizeSearch(query.search, 80);

    const where: Prisma.SupplierCategoryWhereInput = {
      workshopId,
      ...buildSupplierCategoryArchiveFilter(query.archiveStatus),
      ...(normalizedSearch
        ? {
            name: {
              contains: normalizedSearch,
              mode: Prisma.QueryMode.insensitive,
            },
          }
        : {}),
    };

    const [totalItems, data] = await this.prisma.$transaction([
      this.prisma.supplierCategory.count({ where }),
      this.prisma.supplierCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          name: 'asc',
        },
        include: {
          _count: {
            select: {
              supplierAssignments: true,
              supplierParts: true,
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
   * Creates a reusable supplier category for the current workshop.
   */
  async createCategory(workshopId: string, dto: CreateSupplierCategoryDto) {
    const name = normalizeCategoryName(dto.name);
    const description = normalizeOptionalText(dto.description) ?? undefined;

    try {
      return await this.prisma.supplierCategory.create({
        data: {
          workshopId,
          name,
          description,
        },
      });
    } catch (error) {
      handleSupplierCategoryWriteError(error);
    }
  }

  /**
   * Ensures a supplier belongs to the workshop and returns minimal state.
   */
  private async ensureSupplierBelongsToWorkshop(workshopId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id,
        workshopId,
      },
      select: {
        id: true,
        name: true,
        archivedAt: true,
      },
    });

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado.');
    }

    return supplier;
  }

  /**
   * Replaces supplier category assignments, creating missing categories first.
   */
  private async replaceSupplierCategories(
    prisma: SuppliersPrismaClient,
    workshopId: string,
    supplierId: string,
    categoryNames: string[],
  ): Promise<void> {
    const normalizedCategoryNames = normalizeCategoryNames(categoryNames);

    await prisma.supplierCategoryAssignment.deleteMany({
      where: {
        workshopId,
        supplierId,
      },
    });

    if (normalizedCategoryNames.length === 0) {
      return;
    }

    const categories = await Promise.all(
      normalizedCategoryNames.map((name) =>
        prisma.supplierCategory.upsert({
          where: {
            workshopId_name: {
              workshopId,
              name,
            },
          },
          update: {
            archivedAt: null,
          },
          create: {
            workshopId,
            name,
          },
          select: {
            id: true,
          },
        }),
      ),
    );

    await prisma.supplierCategoryAssignment.createMany({
      data: categories.map((category) => ({
        workshopId,
        supplierId,
        categoryId: category.id,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Persists a supplier audit event.
   */
  private async createSupplierEvent(
    prisma: SuppliersPrismaClient,
    {
      workshopId,
      supplierId,
      userId,
      type,
      description,
      metadata,
    }: {
      workshopId: string;
      supplierId: string;
      userId?: string;
      type: SupplierEventType;
      description: string;
      metadata?: Prisma.InputJsonValue;
    },
  ): Promise<void> {
    await prisma.supplierEvent.create({
      data: {
        workshopId,
        supplierId,
        userId,
        type,
        description,
        metadata,
      },
    });
  }

  /**
   * Builds financial metrics grouped by supplier id.
   */
  private async buildSupplierMetricsMap(
    workshopId: string,
    supplierIds: string[],
  ): Promise<Map<string, SupplierMetrics>> {
    const metricsBySupplierId = new Map<string, SupplierMetrics>();

    for (const supplierId of supplierIds) {
      metricsBySupplierId.set(supplierId, createEmptySupplierMetrics());
    }

    if (supplierIds.length === 0) {
      return metricsBySupplierId;
    }

    const [purchaseAggregates, paymentAggregates] = await this.prisma.$transaction([
      this.prisma.workOrderPartLine.groupBy({
        by: ['supplierId'],
        orderBy: {
          supplierId: 'asc',
        },
        where: {
          workshopId,
          supplierId: {
            in: supplierIds,
          },
        },
        _sum: {
          supplierSubtotal: true,
          customerSubtotal: true,
          grossProfit: true,
        },
      }),
      this.prisma.supplierPayment.groupBy({
        by: ['supplierId'],
        orderBy: {
          supplierId: 'asc',
        },
        where: {
          workshopId,
          supplierId: {
            in: supplierIds,
          },
          voidedAt: null,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    for (const aggregate of purchaseAggregates) {
      if (!aggregate.supplierId) {
        continue;
      }

      const metrics = getSupplierMetrics(metricsBySupplierId, aggregate.supplierId);
      metrics.purchasedTotal = decimalToNumber(
        aggregate._sum?.supplierSubtotal,
      );
      metrics.chargedToCustomerTotal = decimalToNumber(
        aggregate._sum?.customerSubtotal,
      );
      metrics.grossProfitTotal = decimalToNumber(aggregate._sum?.grossProfit);
    }

    for (const aggregate of paymentAggregates) {
      const metrics = getSupplierMetrics(metricsBySupplierId, aggregate.supplierId);
      metrics.paidTotal = decimalToNumber(aggregate._sum?.amount);
    }

    for (const [supplierId, metrics] of metricsBySupplierId) {
      metrics.pendingBalance = roundMoney(metrics.purchasedTotal - metrics.paidTotal);
      metricsBySupplierId.set(supplierId, metrics);
    }

    return metricsBySupplierId;
  }

  /**
   * Include used by supplier lists.
   */
  private getListInclude() {
    return {
      categoryAssignments: {
        include: {
          category: true,
        },
      },
      _count: {
        select: {
          parts: true,
          payments: true,
          workOrderPartLines: true,
        },
      },
    } satisfies Prisma.SupplierInclude;
  }

  /**
   * Include used by supplier detail/profile pages.
   */
  private getDetailInclude() {
    return {
      categoryAssignments: {
        include: {
          category: true,
        },
      },
      parts: {
        where: {
          archivedAt: null,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 8,
        include: {
          category: true,
        },
      },
      payments: {
        orderBy: {
          paidAt: 'desc',
        },
        take: 8,
        include: {
          createdByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          voidedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      workOrderPartLines: {
        orderBy: {
          purchasedAt: 'desc',
        },
        take: 8,
        include: {
          workOrder: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              vehicle: {
                select: {
                  id: true,
                  licensePlate: true,
                  brand: true,
                  model: true,
                  customer: {
                    select: {
                      id: true,
                      fullName: true,
                    },
                  },
                },
              },
            },
          },
          supplierPart: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
      },
      events: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
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
      _count: {
        select: {
          parts: true,
          payments: true,
          workOrderPartLines: true,
        },
      },
    } satisfies Prisma.SupplierInclude;
  }
}

/**
 * Builds archive filter for supplier lists.
 */
function buildSupplierArchiveFilter(
  archiveStatus?: SupplierArchiveStatus,
): Prisma.SupplierWhereInput {
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
 * Builds archive filter for supplier category lists.
 */
function buildSupplierCategoryArchiveFilter(
  archiveStatus?: SupplierArchiveStatus,
): Prisma.SupplierCategoryWhereInput {
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
 * Normalizes supplier create payload.
 */
function normalizeCreateSupplierData(
  dto: CreateSupplierDto,
): NormalizedSupplierCreateData {
  return {
    name: normalizeRequiredText(dto.name, 'Nombre del proveedor'),
    contactName: normalizeOptionalText(dto.contactName) ?? undefined,
    phone: normalizeOptionalPhone(dto.phone) ?? undefined,
    email: normalizeOptionalEmail(dto.email) ?? undefined,
    taxId: normalizeOptionalText(dto.taxId) ?? undefined,
    address: normalizeOptionalText(dto.address) ?? undefined,
    notes: normalizeOptionalMultilineText(dto.notes) ?? undefined,
    categoryNames: normalizeCategoryNames(dto.categoryNames ?? []),
  };
}

/**
 * Normalizes supplier update payload.
 */
function normalizeUpdateSupplierData(
  dto: UpdateSupplierDto,
): NormalizedSupplierUpdateData {
  const data: NormalizedSupplierUpdateData = {};

  if (dto.name !== undefined) {
    data.name = normalizeRequiredText(dto.name, 'Nombre del proveedor');
  }

  if (dto.contactName !== undefined) {
    data.contactName = normalizeOptionalText(dto.contactName);
  }

  if (dto.phone !== undefined) {
    data.phone = normalizeOptionalPhone(dto.phone);
  }

  if (dto.email !== undefined) {
    data.email = normalizeOptionalEmail(dto.email);
  }

  if (dto.taxId !== undefined) {
    data.taxId = normalizeOptionalText(dto.taxId);
  }

  if (dto.address !== undefined) {
    data.address = normalizeOptionalText(dto.address);
  }

  if (dto.notes !== undefined) {
    data.notes = normalizeOptionalMultilineText(dto.notes);
  }

  if (dto.categoryNames !== undefined) {
    data.categoryNames = normalizeCategoryNames(dto.categoryNames);
  }

  return data;
}

/**
 * Maps a supplier record to API response including computed financial metrics.
 */
function mapSupplierForResponse<TSupplier extends { categoryAssignments?: unknown }>(
  supplier: TSupplier,
  metrics: SupplierMetrics,
) {
  const categoryAssignments = Array.isArray(supplier.categoryAssignments)
    ? supplier.categoryAssignments
    : [];

  return {
    ...supplier,
    categories: categoryAssignments
      .map((assignment) =>
        typeof assignment === 'object' && assignment !== null && 'category' in assignment
          ? (assignment as { category?: unknown }).category
          : null,
      )
      .filter(Boolean)
      .sort((firstCategory, secondCategory) =>
        getCategoryName(firstCategory).localeCompare(getCategoryName(secondCategory)),
      ),
    metrics,
  };
}

/**
 * Returns a default metrics object for a supplier.
 */
function createEmptySupplierMetrics(): SupplierMetrics {
  return {
    purchasedTotal: 0,
    paidTotal: 0,
    pendingBalance: 0,
    chargedToCustomerTotal: 0,
    grossProfitTotal: 0,
  };
}

/**
 * Reads metrics from a map or creates a default one.
 */
function getSupplierMetrics(
  metricsBySupplierId: Map<string, SupplierMetrics>,
  supplierId: string,
): SupplierMetrics {
  const metrics = metricsBySupplierId.get(supplierId) ?? createEmptySupplierMetrics();

  if (!metricsBySupplierId.has(supplierId)) {
    metricsBySupplierId.set(supplierId, metrics);
  }

  return metrics;
}

/**
 * Normalizes search text while protecting the database from oversized queries.
 */
function normalizeSearch(search?: string, maxLength = MAX_SEARCH_LENGTH): string | undefined {
  const normalizedSearch = search?.trim();

  if (!normalizedSearch) {
    return undefined;
  }

  return normalizedSearch.slice(0, maxLength);
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
function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalizedValue = normalizeHumanText(value);

  return normalizedValue.length > 0 ? normalizedValue : null;
}

/**
 * Normalizes optional multiline text fields and preserves line breaks.
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
 * Normalizes required multiline text for archive/restore reasons.
 */
function normalizeRequiredMultilineText(value: string, label: string): string {
  const normalizedValue = normalizeOptionalMultilineText(value);

  if (!normalizedValue) {
    throw new BadRequestException(`${label} es obligatorio.`);
  }

  return normalizedValue;
}

/**
 * Normalizes optional phone values without forcing an Argentinian format.
 */
function normalizeOptionalPhone(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (!/^[+\d\s().-]+$/.test(normalizedValue)) {
    throw new BadRequestException(
      'El teléfono solo puede contener números, espacios, guiones, paréntesis o prefijo +.',
    );
  }

  return normalizeHumanText(normalizedValue);
}

/**
 * Normalizes optional email values.
 */
function normalizeOptionalEmail(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  return normalizedValue.length > 0 ? normalizedValue : null;
}

/**
 * Normalizes category names and removes duplicates case-insensitively.
 */
function normalizeCategoryNames(categoryNames: string[]): string[] {
  const normalizedNames = new Map<string, string>();

  for (const categoryName of categoryNames) {
    const normalizedCategoryName = normalizeCategoryName(categoryName);

    if (normalizedCategoryName) {
      normalizedNames.set(normalizedCategoryName.toLowerCase(), normalizedCategoryName);
    }
  }

  return [...normalizedNames.values()];
}

/**
 * Normalizes a category name for consistent display and unique matching.
 */
function normalizeCategoryName(value: string): string {
  const normalizedValue = normalizeHumanText(value).toLowerCase();

  if (!normalizedValue) {
    return '';
  }

  return `${normalizedValue[0].toUpperCase()}${normalizedValue.slice(1)}`;
}

/**
 * Collapses repeated spaces for short human-readable fields.
 */
function normalizeHumanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Converts Prisma Decimal values into API-friendly numbers.
 */
function decimalToNumber(
  value: Prisma.Decimal | number | string | null | undefined,
): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    return roundMoney(value);
  }

  if (typeof value === 'string') {
    return roundMoney(Number(value));
  }

  return roundMoney(value.toNumber());
}

/**
 * Rounds money values to two decimals after aggregate calculations.
 */
function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Reads category names from unknown mapped records.
 */
function getCategoryName(category: unknown): string {
  if (typeof category === 'object' && category !== null && 'name' in category) {
    return String((category as { name?: unknown }).name ?? '');
  }

  return '';
}

/**
 * Converts Prisma supplier write errors into safe HTTP errors.
 */
function handleSupplierWriteError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictException(
      'Ya existe un proveedor con ese nombre en este taller.',
    );
  }

  throw error;
}

/**
 * Converts Prisma category write errors into safe HTTP errors.
 */
function handleSupplierCategoryWriteError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictException(
      'Ya existe una categoría de proveedor con ese nombre en este taller.',
    );
  }

  throw error;
}
