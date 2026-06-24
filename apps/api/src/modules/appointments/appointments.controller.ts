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
import { AppointmentsService } from './appointments.service';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { FindAppointmentsQueryDto } from './dto/find-appointments-query.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

/**
 * HTTP controller for workshop agenda operations.
 *
 * All routes are protected and scoped to the authenticated user's workshop.
 */
@Controller('appointments')
@UseGuards(AuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * Lists paginated appointments for the authenticated workshop.
   */
  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: FindAppointmentsQueryDto,
  ) {
    return this.appointmentsService.findAll(user.workshopId, query);
  }

  /**
   * Returns one appointment by id if it belongs to the authenticated workshop.
   */
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.appointmentsService.findOne(user.workshopId, id);
  }

  /**
   * Creates a new appointment inside the authenticated workshop.
   */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(user.workshopId, dto);
  }

  /**
   * Updates an operational appointment.
   */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(user.workshopId, id, dto);
  }

  /**
   * Marks an appointment as confirmed.
   */
  @Patch(':id/confirm')
  confirm(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.appointmentsService.confirm(user.workshopId, id);
  }

  /**
   * Marks an appointment as completed.
   */
  @Patch(':id/complete')
  complete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.appointmentsService.complete(user.workshopId, id);
  }

  /**
   * Cancels an appointment with a mandatory reason.
   */
  @Patch(':id/cancel')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancel(user.workshopId, id, dto);
  }
}
