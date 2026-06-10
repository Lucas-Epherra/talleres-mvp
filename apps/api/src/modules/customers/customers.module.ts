import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

/**
 * Customers feature module.
 */
@Module({
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}