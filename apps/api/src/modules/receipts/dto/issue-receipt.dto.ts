import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Optional payload used when issuing an internal receipt from a work order.
 */
export class IssueReceiptDto {
  @IsOptional()
  @IsString()
  @MaxLength(800)
  notes?: string;
}