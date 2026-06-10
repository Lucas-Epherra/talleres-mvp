import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

/**
 * Vehicles feature module.
 *
 * Imports AuthModule because vehicle routes are protected with AuthGuard and
 * scoped by the authenticated user's workshopId.
 */
@Module({
  imports: [AuthModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}