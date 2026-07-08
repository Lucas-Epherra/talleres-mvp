import { AppointmentStatus } from '@prisma/client';
import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * Query params accepted by the calendar agenda endpoint.
 *
 * Calendar requests are intentionally bounded by a required date range so the
 * frontend can render a full week or month without relying on paginated data.
 */
export class FindAppointmentsCalendarQueryDto {
  @IsISO8601({ strict: true })
  from!: string;

  @IsISO8601({ strict: true })
  to!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsUUID()
  workOrderId?: string;
}
