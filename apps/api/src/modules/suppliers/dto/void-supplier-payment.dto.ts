import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Payload required to void a supplier payment while keeping audit history.
 */
export class VoidSupplierPaymentDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}
