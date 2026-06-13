import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Payload required to create a customer.
 */
export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(40)
  @Matches(/^[+\d\s().-]+$/, {
    message:
      'Phone can only contain numbers, spaces, dashes, parentheses or +54 prefix.',
  })
  phone!: string;

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