import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

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
   * Returns customers for the provided workshop.
   *
   * Search matches customer name, phone or email.
   */
  async findAll(workshopId: string, search?: string) {
    const normalizedSearch = normalizeSearch(search);

    const where: Prisma.CustomerWhereInput = {
      workshopId,
      ...(normalizedSearch
        ? {
            OR: [
              {
                fullName: {
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
            ],
          }
        : {}),
    };

    return this.prisma.customer.findMany({
      where,
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
    });
  }

  /**
   * Returns one customer if it belongs to the provided workshop.
   */
  async findOne(workshopId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        workshopId,
      },
      include: {
        vehicles: {
          orderBy: {
            createdAt: 'desc',
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
 * Normalizes search text. Phone-like searches are reduced to digits so users can
 * search with or without spaces.
 */
function normalizeSearch(search?: string): string | undefined {
  const normalizedSearch = search?.trim();

  if (!normalizedSearch) {
    return undefined;
  }

  return normalizedSearch;
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
