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
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

/**
 * HTTP controller for vehicle operations.
 *
 * All routes are authenticated and scoped by the authenticated user's workshop.
 */
@UseGuards(AuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  /**
   * Lists vehicles for the authenticated user's workshop.
   */
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    return this.vehiclesService.findAll(user.workshopId, search);
  }

  /**
   * Returns the complete operational vehicle profile.
   *
   * This route feeds the future "Ficha del vehículo" screen.
   */
  @Get(':id/profile')
  findProfile(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.vehiclesService.findProfile(user.workshopId, id);
  }

  /**
   * Returns one vehicle by id if it belongs to the authenticated user's workshop.
   */
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.vehiclesService.findOne(user.workshopId, id);
  }

  /**
   * Creates a new vehicle inside the authenticated user's workshop.
   */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(user.workshopId, dto);
  }

  /**
   * Updates an existing vehicle if it belongs to the authenticated user's workshop.
   */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(user.workshopId, id, dto);
  }
}
