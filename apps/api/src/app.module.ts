import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomersModule } from './modules/customers/customers.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { PrismaModule } from './prisma/prisma.module';

/**
 * Root application module.
 *
 * Registers global infrastructure modules and feature modules.
 */
@Module({
  imports: [PrismaModule, CustomersModule, VehiclesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}