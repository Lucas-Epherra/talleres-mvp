import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  SupplierEventType,
  SupplierMarkupType,
  SupplierPaymentMethod,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ArchiveSupplierDto } from './dto/archive-supplier.dto';
import { ArchiveSupplierPartDto } from './dto/archive-supplier-part.dto';
import { CreateSupplierCategoryDto } from './dto/create-supplier-category.dto';
import { CreateSupplierPartDto } from './dto/create-supplier-part.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { FindSupplierCategoriesQueryDto } from './dto/find-supplier-categories-query.dto';
import {
  type SupplierPartActiveStatus,
  FindSupplierPartsQueryDto,
} from './dto/find-supplier-parts-query.dto';
import {
  type SupplierPaymentStatus,
  FindSupplierPaymentsQueryDto,
} from './dto/find-supplier-payments-query.dto';
import {
  type SupplierArchiveStatus,
  FindSuppliersQueryDto,
} from './dto/find-suppliers-query.dto';
import { RestoreSupplierDto } from './dto/restore-supplier.dto';
import { RestoreSupplierPartDto } from './dto/restore-supplier-part.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { UpdateSupplierPaymentDto } from './dto/update-supplier-payment.dto';
import { UpdateSupplierPartDto } from './dto/update-supplier-part.dto';
import { VoidSupplierPaymentDto } from './dto/void-supplier-payment.dto';

const DEFAULT_SUPPLIERS_PAGE = 1;
const DEFAULT_SUPPLIERS_LIMIT = 10;
const MAX_SEARCH_LENGTH = 120;

const DEFAULT_CATEGORIES_PAGE = 1;
const DEFAULT_CATEGORIES_LIMIT = 50;

const DEFAULT_PARTS_PAGE = 1;
const DEFAULT_PARTS_LIMIT = 10;

const DEFAULT_PAYMENTS_PAGE = 1;
const DEFAULT_PAYMENTS_LIMIT = 10;
const MAX_MONEY_VALUE = 9999999999.99;

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

type SupplierPartPricing = {
  currentCost: number;
  suggestedMarkupType: SupplierMarkupType;
  suggestedMarkupValue: number | null;
  suggestedCustomerPrice: number;
};

type NormalizedSupplierPartCreateData = {
  categoryId?: string;
  name: string;
  sku?: string;
  description?: string;
  currentCost: number;
  suggestedMarkupType: SupplierMarkupType;
  suggestedMarkupValue: number | null;
  suggestedCustomerPrice: number;
  isActive: boolean;
};

type NormalizedSupplierPartUpdateData = {
  categoryId?: string | null;
  name?: string;
  sku?: string | null;
  description?: string | null;
  currentCost: number;
  suggestedMarkupType: SupplierMarkupType;
  suggestedMarkupValue: number | null;
  suggestedCustomerPrice: number;
  isActive?: boolean;
};


type NormalizedSupplierPaymentCreateData = {
  amount: number;
  paidAt: Date;
  method: SupplierPaymentMethod;
  reference?: string;
  notes?: string;
};

type NormalizedSupplierPaymentUpdateData = {
  amount?: number;
  paidAt?: Date;
  method?: SupplierPaymentMethod;
  reference?: string | null;
  notes?: string | null;
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
   * Lists catalog parts for one supplier.
   */
  async findParts(
    workshopId: string,
    supplierId: string,
    query: FindSupplierPartsQueryDto = {},
  ) {
    await this.ensureSupplierBelongsToWorkshop(workshopId, supplierId);

    const page = query.page ?? DEFAULT_PARTS_PAGE;
    const limit = query.limit ?? DEFAULT_PARTS_LIMIT;
    const skip = (page - 1) * limit;
    const normalizedSearch = normalizeSearch(query.search);

    const where: Prisma.SupplierPartWhereInput = {
      workshopId,
      supplierId,
      ...buildSupplierPartArchiveFilter(query.archiveStatus),
      ...buildSupplierPartActiveFilter(query.activeStatus),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
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
                sku: {
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
                category: {
                  name: {
                    contains: normalizedSearch,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [totalItems, data] = await this.prisma.$transaction([
      this.prisma.supplierPart.count({ where }),
      this.prisma.supplierPart.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
        include: {
          category: true,
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
      data: data.map(mapSupplierPartForResponse),
      meta,
    };
  }

  /**
   * Creates one catalog part for a supplier.
   */
  async createPart(
    workshopId: string,
    userId: string,
    supplierId: string,
    dto: CreateSupplierPartDto,
  ) {
    const supplier = await this.ensureSupplierBelongsToWorkshop(
      workshopId,
      supplierId,
    );

    if (supplier.archivedAt) {
      throw new BadRequestException(
        'No se pueden cargar repuestos en un proveedor archivado. Restauralo primero.',
      );
    }

    const data = normalizeSupplierPartCreateData(dto);

    if (data.categoryId) {
      await this.ensureSupplierCategoryBelongsToWorkshop(
        workshopId,
        data.categoryId,
      );
    }

    try {
      const part = await this.prisma.$transaction(async (tx) => {
        const createdPart = await tx.supplierPart.create({
          data: {
            workshopId,
            supplierId: supplier.id,
            categoryId: data.categoryId,
            name: data.name,
            sku: data.sku,
            description: data.description,
            currentCost: data.currentCost,
            suggestedMarkupType: data.suggestedMarkupType,
            suggestedMarkupValue: data.suggestedMarkupValue,
            suggestedCustomerPrice: data.suggestedCustomerPrice,
            isActive: data.isActive,
          },
          include: {
            category: true,
          },
        });

        await this.createSupplierEvent(tx, {
          workshopId,
          supplierId: supplier.id,
          userId,
          type: SupplierEventType.PART_CREATED,
          description: `Se cargó el repuesto ${data.name} para ${supplier.name}.`,
          metadata: {
            partId: createdPart.id,
            currentCost: data.currentCost,
            suggestedCustomerPrice: data.suggestedCustomerPrice,
            suggestedMarkupType: data.suggestedMarkupType,
            suggestedMarkupValue: data.suggestedMarkupValue,
          },
        });

        return createdPart;
      });

      return mapSupplierPartForResponse(part);
    } catch (error) {
      handleSupplierPartWriteError(error);
    }
  }

  /**
   * Updates one catalog part without affecting historical work order lines.
   */
  async updatePart(
    workshopId: string,
    userId: string,
    supplierId: string,
    partId: string,
    dto: UpdateSupplierPartDto,
  ) {
    const supplier = await this.ensureSupplierBelongsToWorkshop(
      workshopId,
      supplierId,
    );

    if (supplier.archivedAt) {
      throw new BadRequestException(
        'No se pueden editar repuestos de un proveedor archivado. Restauralo primero.',
      );
    }

    const currentPart = await this.ensureSupplierPartBelongsToSupplier(
      workshopId,
      supplier.id,
      partId,
    );

    if (currentPart.archivedAt) {
      throw new BadRequestException(
        'Un repuesto archivado no puede editarse. Restauralo primero.',
      );
    }

    const data = normalizeSupplierPartUpdateData(dto, currentPart);

    if (data.categoryId) {
      await this.ensureSupplierCategoryBelongsToWorkshop(
        workshopId,
        data.categoryId,
      );
    }

    try {
      const part = await this.prisma.$transaction(async (tx) => {
        const updatedPart = await tx.supplierPart.update({
          where: {
            id: currentPart.id,
          },
          data: {
            categoryId: data.categoryId,
            name: data.name,
            sku: data.sku,
            description: data.description,
            currentCost: data.currentCost,
            suggestedMarkupType: data.suggestedMarkupType,
            suggestedMarkupValue: data.suggestedMarkupValue,
            suggestedCustomerPrice: data.suggestedCustomerPrice,
            isActive: data.isActive,
          },
          include: {
            category: true,
          },
        });

        await this.createSupplierEvent(tx, {
          workshopId,
          supplierId: supplier.id,
          userId,
          type: SupplierEventType.PART_UPDATED,
          description: `Se actualizó el repuesto ${updatedPart.name}.`,
          metadata: {
            partId: updatedPart.id,
            currentCost: data.currentCost,
            suggestedCustomerPrice: data.suggestedCustomerPrice,
            suggestedMarkupType: data.suggestedMarkupType,
            suggestedMarkupValue: data.suggestedMarkupValue,
          },
        });

        return updatedPart;
      });

      return mapSupplierPartForResponse(part);
    } catch (error) {
      handleSupplierPartWriteError(error);
    }
  }

  /**
   * Archives one catalog part without deleting historical work order lines.
   */
  async archivePart(
    workshopId: string,
    userId: string,
    supplierId: string,
    partId: string,
    dto: ArchiveSupplierPartDto,
  ) {
    const supplier = await this.ensureSupplierBelongsToWorkshop(
      workshopId,
      supplierId,
    );
    const currentPart = await this.ensureSupplierPartBelongsToSupplier(
      workshopId,
      supplier.id,
      partId,
    );

    if (currentPart.archivedAt) {
      throw new BadRequestException('El repuesto ya está archivado.');
    }

    const reason = normalizeRequiredMultilineText(
      dto.reason,
      'Motivo de archivado',
    );
    const archivedAt = new Date();

    const part = await this.prisma.$transaction(async (tx) => {
      const archivedPart = await tx.supplierPart.update({
        where: {
          id: currentPart.id,
        },
        data: {
          archivedAt,
          isActive: false,
        },
        include: {
          category: true,
        },
      });

      await this.createSupplierEvent(tx, {
        workshopId,
        supplierId: supplier.id,
        userId,
        type: SupplierEventType.PART_ARCHIVED,
        description: `Se archivó el repuesto ${currentPart.name}. Motivo: ${reason}`,
        metadata: {
          partId: currentPart.id,
          reason,
        },
      });

      return archivedPart;
    });

    return mapSupplierPartForResponse(part);
  }

  /**
   * Restores one archived catalog part and makes it operational again.
   */
  async restorePart(
    workshopId: string,
    userId: string,
    supplierId: string,
    partId: string,
    dto: RestoreSupplierPartDto,
  ) {
    const supplier = await this.ensureSupplierBelongsToWorkshop(
      workshopId,
      supplierId,
    );

    if (supplier.archivedAt) {
      throw new BadRequestException(
        'No se puede restaurar un repuesto de un proveedor archivado. Restaurá primero el proveedor.',
      );
    }

    const currentPart = await this.ensureSupplierPartBelongsToSupplier(
      workshopId,
      supplier.id,
      partId,
    );

    if (!currentPart.archivedAt) {
      throw new BadRequestException('El repuesto no está archivado.');
    }

    const reason = normalizeRequiredMultilineText(
      dto.reason,
      'Motivo de restauración',
    );

    const part = await this.prisma.$transaction(async (tx) => {
      const restoredPart = await tx.supplierPart.update({
        where: {
          id: currentPart.id,
        },
        data: {
          archivedAt: null,
          isActive: true,
        },
        include: {
          category: true,
        },
      });

      await this.createSupplierEvent(tx, {
        workshopId,
        supplierId: supplier.id,
        userId,
        type: SupplierEventType.PART_UPDATED,
        description: `Se restauró el repuesto ${currentPart.name}. Motivo: ${reason}`,
        metadata: {
          partId: currentPart.id,
          reason,
        },
      });

      return restoredPart;
    });

    return mapSupplierPartForResponse(part);
  }


  /**
   * Lists payments registered for one supplier.
   */
  async findPayments(
    workshopId: string,
    supplierId: string,
    query: FindSupplierPaymentsQueryDto = {},
  ) {
    await this.ensureSupplierBelongsToWorkshop(workshopId, supplierId);

    const page = query.page ?? DEFAULT_PAYMENTS_PAGE;
    const limit = query.limit ?? DEFAULT_PAYMENTS_LIMIT;
    const skip = (page - 1) * limit;
    const normalizedSearch = normalizeSearch(query.search);

    const where: Prisma.SupplierPaymentWhereInput = {
      workshopId,
      supplierId,
      ...buildSupplierPaymentStatusFilter(query.paymentStatus),
      ...(query.method ? { method: query.method } : {}),
      ...buildSupplierPaymentDateFilter(query.from, query.to),
      ...(normalizedSearch
        ? {
            OR: [
              {
                reference: {
                  contains: normalizedSearch,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                notes: {
                  contains: normalizedSearch,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            ],
          }
        : {}),
    };

    const [totalItems, data] = await this.prisma.$transaction([
      this.prisma.supplierPayment.count({ where }),
      this.prisma.supplierPayment.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          paidAt: 'desc',
        },
        include: this.getPaymentInclude(),
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
      data: data.map(mapSupplierPaymentForResponse),
      meta,
    };
  }

  /**
   * Registers a payment made to a supplier.
   */
  async createPayment(
    workshopId: string,
    userId: string,
    supplierId: string,
    dto: CreateSupplierPaymentDto,
  ) {
    const supplier = await this.ensureSupplierBelongsToWorkshop(
      workshopId,
      supplierId,
    );
    const data = normalizeSupplierPaymentCreateData(dto);

    const payment = await this.prisma.$transaction(async (tx) => {
      const createdPayment = await tx.supplierPayment.create({
        data: {
          workshopId,
          supplierId: supplier.id,
          createdByUserId: userId,
          amount: data.amount,
          paidAt: data.paidAt,
          method: data.method,
          reference: data.reference,
          notes: data.notes,
        },
        include: this.getPaymentInclude(),
      });

      await this.createSupplierEvent(tx, {
        workshopId,
        supplierId: supplier.id,
        userId,
        type: SupplierEventType.PAYMENT_CREATED,
        description: `Se registró un pago a ${supplier.name} por $${data.amount.toFixed(2)}.`,
        metadata: {
          paymentId: createdPayment.id,
          amount: data.amount,
          paidAt: data.paidAt.toISOString(),
          method: data.method,
          reference: data.reference,
        },
      });

      return createdPayment;
    });

    return mapSupplierPaymentForResponse(payment);
  }

  /**
   * Corrects an active supplier payment.
   */
  async updatePayment(
    workshopId: string,
    userId: string,
    supplierId: string,
    paymentId: string,
    dto: UpdateSupplierPaymentDto,
  ) {
    const supplier = await this.ensureSupplierBelongsToWorkshop(
      workshopId,
      supplierId,
    );
    const currentPayment = await this.ensureSupplierPaymentBelongsToSupplier(
      workshopId,
      supplier.id,
      paymentId,
    );

    if (currentPayment.voidedAt) {
      throw new BadRequestException(
        'Un pago anulado no puede editarse. Registrá un nuevo pago si corresponde.',
      );
    }

    const data = normalizeSupplierPaymentUpdateData(dto);

    const payment = await this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.supplierPayment.update({
        where: {
          id: currentPayment.id,
        },
        data: {
          amount: data.amount,
          paidAt: data.paidAt,
          method: data.method,
          reference: data.reference,
          notes: data.notes,
        },
        include: this.getPaymentInclude(),
      });

      await this.createSupplierEvent(tx, {
        workshopId,
        supplierId: supplier.id,
        userId,
        type: SupplierEventType.PAYMENT_UPDATED,
        description: `Se actualizó un pago de ${supplier.name}.`,
        metadata: {
          paymentId: updatedPayment.id,
          amount: decimalToNumber(updatedPayment.amount),
          paidAt: updatedPayment.paidAt.toISOString(),
          method: updatedPayment.method,
          reference: updatedPayment.reference,
        },
      });

      return updatedPayment;
    });

    return mapSupplierPaymentForResponse(payment);
  }

  /**
   * Voids a supplier payment without deleting financial history.
   */
  async voidPayment(
    workshopId: string,
    userId: string,
    supplierId: string,
    paymentId: string,
    dto: VoidSupplierPaymentDto,
  ) {
    const supplier = await this.ensureSupplierBelongsToWorkshop(
      workshopId,
      supplierId,
    );
    const currentPayment = await this.ensureSupplierPaymentBelongsToSupplier(
      workshopId,
      supplier.id,
      paymentId,
    );

    if (currentPayment.voidedAt) {
      throw new BadRequestException('El pago ya está anulado.');
    }

    const reason = normalizeRequiredMultilineText(dto.reason, 'Motivo de anulación');
    const voidedAt = new Date();

    const payment = await this.prisma.$transaction(async (tx) => {
      const voidedPayment = await tx.supplierPayment.update({
        where: {
          id: currentPayment.id,
        },
        data: {
          voidedAt,
          voidedReason: reason,
          voidedByUserId: userId,
        },
        include: this.getPaymentInclude(),
      });

      await this.createSupplierEvent(tx, {
        workshopId,
        supplierId: supplier.id,
        userId,
        type: SupplierEventType.PAYMENT_VOIDED,
        description: `Se anuló un pago a ${supplier.name}. Motivo: ${reason}`,
        metadata: {
          paymentId: currentPayment.id,
          amount: decimalToNumber(currentPayment.amount),
          reason,
        },
      });

      return voidedPayment;
    });

    return mapSupplierPaymentForResponse(payment);
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
   * Ensures a category belongs to the workshop and can be used by catalog parts.
   */
  private async ensureSupplierCategoryBelongsToWorkshop(
    workshopId: string,
    categoryId: string,
    prisma: SuppliersPrismaClient = this.prisma,
  ) {
    const category = await prisma.supplierCategory.findFirst({
      where: {
        id: categoryId,
        workshopId,
      },
      select: {
        id: true,
        archivedAt: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Categoría de proveedor no encontrada.');
    }

    if (category.archivedAt) {
      throw new BadRequestException(
        'La categoría seleccionada está archivada.',
      );
    }

    return category;
  }

  /**
   * Ensures one supplier part belongs to the supplier and workshop.
   */
  private async ensureSupplierPartBelongsToSupplier(
    workshopId: string,
    supplierId: string,
    partId: string,
  ) {
    const part = await this.prisma.supplierPart.findFirst({
      where: {
        id: partId,
        workshopId,
        supplierId,
      },
      select: {
        id: true,
        name: true,
        categoryId: true,
        currentCost: true,
        suggestedMarkupType: true,
        suggestedMarkupValue: true,
        suggestedCustomerPrice: true,
        isActive: true,
        archivedAt: true,
      },
    });

    if (!part) {
      throw new NotFoundException('Repuesto del proveedor no encontrado.');
    }

    return part;
  }


  /**
   * Ensures one payment belongs to the supplier and workshop.
   */
  private async ensureSupplierPaymentBelongsToSupplier(
    workshopId: string,
    supplierId: string,
    paymentId: string,
  ) {
    const payment = await this.prisma.supplierPayment.findFirst({
      where: {
        id: paymentId,
        workshopId,
        supplierId,
      },
      select: {
        id: true,
        amount: true,
        paidAt: true,
        method: true,
        reference: true,
        notes: true,
        voidedAt: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Pago de proveedor no encontrado.');
    }

    return payment;
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
   * Include used by supplier payment lists and mutations.
   */
  private getPaymentInclude() {
    return {
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
    } satisfies Prisma.SupplierPaymentInclude;
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
 * Builds status filter for supplier payment lists.
 */
function buildSupplierPaymentStatusFilter(
  paymentStatus?: SupplierPaymentStatus,
): Prisma.SupplierPaymentWhereInput {
  if (paymentStatus === 'all') {
    return {};
  }

  if (paymentStatus === 'voided') {
    return {
      voidedAt: {
        not: null,
      },
    };
  }

  return {
    voidedAt: null,
  };
}

/**
 * Builds paidAt boundaries for supplier payment lists.
 */
function buildSupplierPaymentDateFilter(
  from?: string,
  to?: string,
): Prisma.SupplierPaymentWhereInput {
  if (!from && !to) {
    return {};
  }

  return {
    paidAt: {
      ...(from ? { gte: parsePaymentDate(from, 'Fecha desde') } : {}),
      ...(to ? { lte: parsePaymentDate(to, 'Fecha hasta') } : {}),
    },
  };
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
 * Normalizes supplier payment create payload.
 */
function normalizeSupplierPaymentCreateData(
  dto: CreateSupplierPaymentDto,
): NormalizedSupplierPaymentCreateData {
  return {
    amount: normalizePositiveMoney(dto.amount, 'Monto del pago'),
    paidAt: normalizePaymentDate(dto.paidAt, 'Fecha de pago') ?? new Date(),
    method: dto.method ?? SupplierPaymentMethod.OTHER,
    reference: normalizeOptionalText(dto.reference) ?? undefined,
    notes: normalizeOptionalMultilineText(dto.notes) ?? undefined,
  };
}

/**
 * Normalizes supplier payment update payload.
 */
function normalizeSupplierPaymentUpdateData(
  dto: UpdateSupplierPaymentDto,
): NormalizedSupplierPaymentUpdateData {
  const data: NormalizedSupplierPaymentUpdateData = {};

  if (dto.amount !== undefined && dto.amount !== null) {
    data.amount = normalizePositiveMoney(dto.amount, 'Monto del pago');
  }

  if (dto.paidAt !== undefined) {
    const paidAt = normalizePaymentDate(dto.paidAt, 'Fecha de pago');

    if (paidAt) {
      data.paidAt = paidAt;
    }
  }

  if (dto.method !== undefined) {
    data.method = dto.method;
  }

  if (dto.reference !== undefined) {
    data.reference = normalizeOptionalText(dto.reference);
  }

  if (dto.notes !== undefined) {
    data.notes = normalizeOptionalMultilineText(dto.notes);
  }

  return data;
}

/**
 * Normalizes optional payment date strings into Date objects.
 */
function normalizePaymentDate(
  value: string | null | undefined,
  label: string,
): Date | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return parsePaymentDate(value, label);
}

/**
 * Parses payment dates and rejects invalid values with a safe message.
 */
function parsePaymentDate(value: string, label: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${label} no es válida.`);
  }

  return date;
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
 * Builds archive filter for supplier part lists.
 */
function buildSupplierPartArchiveFilter(
  archiveStatus?: SupplierArchiveStatus,
): Prisma.SupplierPartWhereInput {
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
 * Builds active/inactive filter for supplier part lists.
 */
function buildSupplierPartActiveFilter(
  activeStatus?: SupplierPartActiveStatus,
): Prisma.SupplierPartWhereInput {
  if (activeStatus === 'all') {
    return {};
  }

  if (activeStatus === 'inactive') {
    return {
      isActive: false,
    };
  }

  return {
    isActive: true,
  };
}

/**
 * Normalizes catalog part create payload and resolves suggested customer price.
 */
function normalizeSupplierPartCreateData(
  dto: CreateSupplierPartDto,
): NormalizedSupplierPartCreateData {
  const currentCost = normalizeMoney(dto.currentCost, 'Costo proveedor');
  const pricing = resolveSupplierPartPricing({
    currentCost,
    suggestedMarkupType: dto.suggestedMarkupType ?? SupplierMarkupType.NONE,
    suggestedMarkupValue: dto.suggestedMarkupValue,
    suggestedCustomerPrice: dto.suggestedCustomerPrice,
  });

  return {
    categoryId: dto.categoryId,
    name: normalizeRequiredText(dto.name, 'Nombre del repuesto'),
    sku: normalizeOptionalText(dto.sku) ?? undefined,
    description: normalizeOptionalMultilineText(dto.description) ?? undefined,
    currentCost,
    suggestedMarkupType: pricing.suggestedMarkupType,
    suggestedMarkupValue: pricing.suggestedMarkupValue,
    suggestedCustomerPrice: pricing.suggestedCustomerPrice,
    isActive: dto.isActive ?? true,
  };
}

/**
 * Normalizes catalog part update payload using the current persisted values as defaults.
 */
function normalizeSupplierPartUpdateData(
  dto: UpdateSupplierPartDto,
  currentPart: {
    currentCost: Prisma.Decimal | number | string;
    suggestedMarkupType: SupplierMarkupType | null;
    suggestedMarkupValue: Prisma.Decimal | number | string | null;
    suggestedCustomerPrice: Prisma.Decimal | number | string | null;
  },
): NormalizedSupplierPartUpdateData {
  const currentCost =
    dto.currentCost !== undefined && dto.currentCost !== null
      ? normalizeMoney(dto.currentCost, 'Costo proveedor')
      : decimalToNumber(currentPart.currentCost);
  const suggestedMarkupType =
    dto.suggestedMarkupType ??
    currentPart.suggestedMarkupType ??
    SupplierMarkupType.NONE;
  const suggestedMarkupValue =
    dto.suggestedMarkupValue !== undefined
      ? dto.suggestedMarkupValue
      : currentPart.suggestedMarkupValue;
  const suggestedCustomerPrice =
    dto.suggestedCustomerPrice !== undefined
      ? dto.suggestedCustomerPrice
      : currentPart.suggestedCustomerPrice;
  const pricing = resolveSupplierPartPricing({
    currentCost,
    suggestedMarkupType,
    suggestedMarkupValue,
    suggestedCustomerPrice,
  });
  const data: NormalizedSupplierPartUpdateData = {
    currentCost,
    suggestedMarkupType: pricing.suggestedMarkupType,
    suggestedMarkupValue: pricing.suggestedMarkupValue,
    suggestedCustomerPrice: pricing.suggestedCustomerPrice,
  };

  if (dto.categoryId !== undefined) {
    data.categoryId = dto.categoryId;
  }

  if (dto.name !== undefined) {
    data.name = normalizeRequiredText(dto.name, 'Nombre del repuesto');
  }

  if (dto.sku !== undefined) {
    data.sku = normalizeOptionalText(dto.sku);
  }

  if (dto.description !== undefined) {
    data.description = normalizeOptionalMultilineText(dto.description);
  }

  if (dto.isActive !== undefined) {
    data.isActive = dto.isActive;
  }

  return data;
}

/**
 * Resolves suggested catalog pricing from cost and markup rules.
 */
function resolveSupplierPartPricing({
  currentCost,
  suggestedMarkupType,
  suggestedMarkupValue,
  suggestedCustomerPrice,
}: {
  currentCost: number;
  suggestedMarkupType: SupplierMarkupType;
  suggestedMarkupValue?: Prisma.Decimal | number | string | null;
  suggestedCustomerPrice?: Prisma.Decimal | number | string | null;
}): SupplierPartPricing {
  if (suggestedMarkupType === SupplierMarkupType.NONE) {
    return {
      currentCost,
      suggestedMarkupType,
      suggestedMarkupValue: null,
      suggestedCustomerPrice: currentCost,
    };
  }

  if (suggestedMarkupType === SupplierMarkupType.PERCENTAGE) {
    const markupValue = normalizeNullableMoney(
      suggestedMarkupValue,
      'Porcentaje de recargo',
    );
    const safeMarkupValue = markupValue ?? 0;

    return {
      currentCost,
      suggestedMarkupType,
      suggestedMarkupValue: safeMarkupValue,
      suggestedCustomerPrice: roundMoney(currentCost * (1 + safeMarkupValue / 100)),
    };
  }

  if (suggestedMarkupType === SupplierMarkupType.FIXED_AMOUNT) {
    const markupValue = normalizeNullableMoney(
      suggestedMarkupValue,
      'Recargo fijo',
    );
    const safeMarkupValue = markupValue ?? 0;

    return {
      currentCost,
      suggestedMarkupType,
      suggestedMarkupValue: safeMarkupValue,
      suggestedCustomerPrice: roundMoney(currentCost + safeMarkupValue),
    };
  }

  return {
    currentCost,
    suggestedMarkupType: SupplierMarkupType.MANUAL_PRICE,
    suggestedMarkupValue: null,
    suggestedCustomerPrice: normalizeNullableMoney(
      suggestedCustomerPrice,
      'Precio sugerido al cliente',
    ) ?? currentCost,
  };
}


/**
 * Normalizes required positive money values.
 */
function normalizePositiveMoney(value: unknown, label: string): number {
  const normalizedValue = normalizeMoney(value, label);

  if (normalizedValue <= 0) {
    throw new BadRequestException(`${label} debe ser mayor a cero.`);
  }

  return normalizedValue;
}

/**
 * Normalizes required money values.
 */
function normalizeMoney(value: unknown, label: string): number {
  const normalizedValue = normalizeNullableMoney(value, label);

  if (normalizedValue === null) {
    throw new BadRequestException(`${label} es obligatorio.`);
  }

  return normalizedValue;
}

/**
 * Normalizes optional money values.
 */
function normalizeNullableMoney(value: unknown, label: string): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    throw new BadRequestException(`${label} debe ser un número válido.`);
  }

  if (numericValue < 0) {
    throw new BadRequestException(`${label} no puede ser negativo.`);
  }

  if (numericValue > MAX_MONEY_VALUE) {
    throw new BadRequestException(`${label} es demasiado alto.`);
  }

  return roundMoney(numericValue);
}


/**
 * Maps a supplier payment to an API-friendly response with numeric money values.
 */
function mapSupplierPaymentForResponse(payment: unknown) {
  if (typeof payment !== 'object' || payment === null) {
    return payment;
  }

  const typedPayment = payment as {
    amount?: Prisma.Decimal | number | string | null;
  };

  return {
    ...typedPayment,
    amount: decimalToNumber(typedPayment.amount),
  };
}

/**
 * Maps a supplier part to an API-friendly response with numeric money values.
 */
function mapSupplierPartForResponse(part: unknown) {
  if (typeof part !== 'object' || part === null) {
    return part;
  }

  const typedPart = part as {
    currentCost?: Prisma.Decimal | number | string | null;
    suggestedMarkupValue?: Prisma.Decimal | number | string | null;
    suggestedCustomerPrice?: Prisma.Decimal | number | string | null;
  };

  return {
    ...typedPart,
    currentCost: decimalToNumber(typedPart.currentCost),
    suggestedMarkupValue:
      typedPart.suggestedMarkupValue === null ||
      typedPart.suggestedMarkupValue === undefined
        ? null
        : decimalToNumber(typedPart.suggestedMarkupValue),
    suggestedCustomerPrice:
      typedPart.suggestedCustomerPrice === null ||
      typedPart.suggestedCustomerPrice === undefined
        ? null
        : decimalToNumber(typedPart.suggestedCustomerPrice),
  };
}

/**
 * Maps a supplier record to API response including computed financial metrics.
 */
function mapSupplierForResponse<
  TSupplier extends {
    categoryAssignments?: unknown;
    parts?: unknown;
    payments?: unknown;
  },
>(supplier: TSupplier, metrics: SupplierMetrics) {
  const categoryAssignments = Array.isArray(supplier.categoryAssignments)
    ? supplier.categoryAssignments
    : [];
  const parts = Array.isArray(supplier.parts) ? supplier.parts : undefined;
  const payments = Array.isArray(supplier.payments)
    ? supplier.payments
    : undefined;

  return {
    ...supplier,
    ...(parts ? { parts: parts.map(mapSupplierPartForResponse) } : {}),
    ...(payments
      ? { payments: payments.map(mapSupplierPaymentForResponse) }
      : {}),
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
 * Converts Prisma supplier part write errors into safe HTTP errors.
 */
function handleSupplierPartWriteError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictException(
      'Ya existe un repuesto con ese nombre para este proveedor.',
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
