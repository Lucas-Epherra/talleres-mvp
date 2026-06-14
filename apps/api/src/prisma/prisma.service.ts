import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Centralized Prisma client for database access.
 *
 * This service is registered as a NestJS provider so all modules depend on the
 * same database access layer instead of instantiating Prisma manually.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Opens the database connection when the NestJS module is initialized.
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * Closes the database connection when the NestJS app shuts down.
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
