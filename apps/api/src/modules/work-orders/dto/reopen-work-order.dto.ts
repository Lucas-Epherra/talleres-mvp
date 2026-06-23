import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Payload accepted when reopening a delivered work order.
 *
 * The reason is required because reopening a delivered order is an exceptional
 * operation that must remain traceable in the audit timeline.
 */
export class ReopenWorkOrderDto {
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  reason!: string;
}
