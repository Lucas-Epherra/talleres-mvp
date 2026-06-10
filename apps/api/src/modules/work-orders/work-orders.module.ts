import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';

/**
 * Work orders feature module.
 *
 * Imports AuthModule because work order routes are protected with AuthGuard and
 * scoped by the authenticated user's workshopId.
 */
@Module({
  imports: [AuthModule],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
})
export class WorkOrdersModule {}