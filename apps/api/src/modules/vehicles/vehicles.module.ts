import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

/**
 * Vehicles feature module.
 */
@Module({
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}