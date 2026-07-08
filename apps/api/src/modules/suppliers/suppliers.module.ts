import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

/**
 * Suppliers feature module.
 *
 * Imports AuthModule because supplier routes are protected with AuthGuard and
 * every operation is scoped to the authenticated workshop.
 */
@Module({
  imports: [AuthModule],
  controllers: [SuppliersController],
  providers: [SuppliersService],
})
export class SuppliersModule {}
