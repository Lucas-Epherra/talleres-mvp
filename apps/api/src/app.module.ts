import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

/**
 * Root application module.
 *
 * Registers global infrastructure modules and the initial health-check
 * controller used during the setup phase.
 */
@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}