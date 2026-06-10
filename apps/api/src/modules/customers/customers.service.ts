import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

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
    const where: Prisma.CustomerWhereInput = {
      workshopId,
      ...(search
        ? {
            OR: [
              {
                fullName: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                phone: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                email: {
                  contains: search,
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
    return this.prisma.customer.create({
      data: {
        workshopId,
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        notes: dto.notes,
      },
    });
  }

  /**
   * Updates a customer if it belongs to the provided workshop.
   */
  async update(workshopId: string, id: string, dto: UpdateCustomerDto) {
    await this.findOne(workshopId, id);

    return this.prisma.customer.update({
      where: {
        id,
      },
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        notes: dto.notes,
      },
    });
  }
}