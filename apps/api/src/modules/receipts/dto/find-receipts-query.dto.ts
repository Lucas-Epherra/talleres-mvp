import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const RECEIPT_EMAIL_STATUSES = ['sent', 'not_sent'] as const;

export type ReceiptEmailStatus = (typeof RECEIPT_EMAIL_STATUSES)[number];

/**
 * Query params supported by the receipts list endpoint.
 */
export class FindReceiptsQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'El id de la orden no es válido.' })
  workOrderId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'La búsqueda no puede superar 120 caracteres.' })
  search?: string;

  @IsOptional()
  @IsIn(RECEIPT_EMAIL_STATUSES, {
    message: 'El estado de envío debe ser sent o not_sent.',
  })
  emailStatus?: ReceiptEmailStatus;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha desde no es válida.' })
  issuedFrom?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha hasta no es válida.' })
  issuedTo?: string;

  @IsOptional()
  @Matches(/^\d+$/, { message: 'La página debe ser un número positivo.' })
  page?: string;

  @IsOptional()
  @Matches(/^\d+$/, { message: 'El límite debe ser un número positivo.' })
  limit?: string;
}
