import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Payload accepted when updating a customer.
 *
 * All fields are optional because PATCH requests may update only part of the
 * customer profile. When phone is provided, it is still required to be valid
 * because phone is the operational unique identifier for customers.
 */
export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(40)
  @Matches(/^[+\d\s().-]+$/, {
    message:
      'Phone can only contain numbers, spaces, dashes, parentheses or +54 prefix.',
  })
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  notes?: string;
}