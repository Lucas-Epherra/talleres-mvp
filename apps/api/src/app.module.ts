import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ReceiptsModule } from './modules/receipts/receipts.module';
import { PlatformModule } from './modules/platform/platform.module';
import { WorkshopSettingsModule } from './modules/workshop-settings/workshop-settings.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PrismaModule } from './prisma/prisma.module';

/**
 * Root application module.
 *
 * Registers global infrastructure modules and feature modules.
 */
@Module({
  imports: [
    SentryModule.forRoot(),
    PrismaModule,
    AuthModule,
    CustomersModule,
    VehiclesModule,
    WorkOrdersModule,
    AppointmentsModule,
    DashboardModule,
    PlatformModule,
    ReceiptsModule,
    WorkshopSettingsModule,
    SuppliersModule,
  ],
  controllers: [AppController],
  providers: [
    // Reports unexpected errors to Sentry; a no-op when Sentry is disabled.
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    AppService,
  ],
})
export class AppModule {}
