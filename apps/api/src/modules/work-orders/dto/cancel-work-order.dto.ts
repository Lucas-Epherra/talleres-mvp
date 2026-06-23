import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Payload required to cancel a work order with operational traceability.
 */
export class CancelWorkOrderDto {
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  reason!: string;
}