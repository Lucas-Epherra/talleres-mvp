import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { PlatformModule } from './modules/platform/platform.module';
import { PrismaModule } from './prisma/prisma.module';

/**
 * Root application module.
 *
 * Registers global infrastructure modules and feature modules.
 */
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CustomersModule,
    VehiclesModule,
    WorkOrdersModule,
    AppointmentsModule,
    DashboardModule,
    PlatformModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
