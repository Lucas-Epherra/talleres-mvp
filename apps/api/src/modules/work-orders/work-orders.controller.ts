import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { WorkOrderStatus } from '@prisma/client';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { WorkOrdersService } from './work-orders.service';

/**
 * HTTP controller for work order operations.
 */
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  /**
   * Lists work orders for the current workshop.
   */
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: WorkOrderStatus,
  ) {
    return this.workOrdersService.findAll(search, status);
  }

  /**
   * Returns one work order by id.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workOrdersService.findOne(id);
  }

  /**
   * Creates a new work order.
   */
  @Post()
  create(@Body() dto: CreateWorkOrderDto) {
    return this.workOrdersService.create(dto);
  }

  /**
   * Updates an existing work order.
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkOrderDto) {
    return this.workOrdersService.update(id, dto);
  }

  /**
   * Updates only the status of a work order.
   */
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderStatusDto,
  ) {
    return this.workOrdersService.updateStatus(id, dto);
  }
}