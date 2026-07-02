import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Payload used to send an issued receipt by email.
 */
export class SendReceiptEmailDto {
  @IsEmail({}, { message: 'Ingresá un email válido.' })
  to!: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  message?: string;
}