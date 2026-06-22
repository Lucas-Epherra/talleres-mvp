import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { FindWorkOrdersQueryDto } from './dto/find-work-orders-query.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { WorkOrdersService } from './work-orders.service';

/**
 * HTTP controller for work order operations.
 *
 * All routes are authenticated and scoped by the authenticated user's workshop.
 */
@UseGuards(AuthGuard)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  /**
   * Lists paginated work orders for the authenticated user's workshop.
   */
  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: FindWorkOrdersQueryDto,
  ) {
    return this.workOrdersService.findAll(user.workshopId, query);
  }

  /**
   * Returns one work order by id if it belongs to the authenticated user's workshop.
   */
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.workOrdersService.findOne(user.workshopId, id);
  }

  /**
   * Creates a new work order inside the authenticated user's workshop.
   */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWorkOrderDto) {
    return this.workOrdersService.create(user.workshopId, user.id, dto);
  }

  /**
   * Updates an existing work order if it belongs to the authenticated user's workshop.
   */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderDto,
  ) {
    return this.workOrdersService.update(user.workshopId, user.id, id, dto);
  }

  /**
   * Updates only the status of a work order if it belongs to the authenticated user's workshop.
   */
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderStatusDto,
  ) {
    return this.workOrdersService.updateStatus(
      user.workshopId,
      user.id,
      id,
      dto,
    );
  }
}
