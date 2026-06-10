import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

/**
 * Customers feature module.
 *
 * Imports AuthModule because customer routes are protected with AuthGuard.
 */
@Module({
  imports: [AuthModule],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}