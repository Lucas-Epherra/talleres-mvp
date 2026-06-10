import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

/**
 * HTTP controller for vehicle operations.
 */
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  /**
   * Lists vehicles for the current workshop.
   */
  @Get()
  findAll(@Query('search') search?: string) {
    return this.vehiclesService.findAll(search);
  }

  /**
   * Returns one vehicle by id.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  /**
   * Creates a new vehicle.
   */
  @Post()
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  /**
   * Updates an existing vehicle.
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }
}