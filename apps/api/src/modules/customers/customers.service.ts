import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DEMO_WORKSHOP_ID } from '../../common/constants/demo-workshop.constant';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

/**
 * Handles customer persistence and lookup operations.
 *
 * Every query is scoped by workshopId to keep the backend compatible with a
 * future multi-tenant SaaS model.
 */
@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns customers for the current workshop.
   *
   * Search matches customer name, phone or email.
   */
  async findAll(search?: string) {
    const where: Prisma.CustomerWhereInput = {
      workshopId: DEMO_WORKSHOP_ID,
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
   * Returns one customer if it belongs to the current workshop.
   */
  async findOne(id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        workshopId: DEMO_WORKSHOP_ID,
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
   * Creates a customer inside the current workshop.
   */
  async create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        workshopId: DEMO_WORKSHOP_ID,
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        notes: dto.notes,
      },
    });
  }

  /**
   * Updates a customer if it belongs to the current workshop.
   */
  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);

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