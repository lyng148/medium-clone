import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { USER_VALIDATION } from '../users.constant';

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(USER_VALIDATION.PASSWORD.MIN_LENGTH, { message: USER_VALIDATION.PASSWORD.MESSAGE })
  password: string;
}
