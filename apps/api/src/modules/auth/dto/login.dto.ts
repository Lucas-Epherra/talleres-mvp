import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * Payload required to authenticate an internal workshop user.
 */
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}