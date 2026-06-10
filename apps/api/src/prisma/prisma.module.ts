import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global database module.
 *
 * Exposes PrismaService across the backend without needing to manually import
 * the database provider in every feature module.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}