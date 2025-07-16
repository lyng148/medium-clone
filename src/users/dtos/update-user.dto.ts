import { IsEmail, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import { USER_VALIDATION } from '../users.constant';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: USER_VALIDATION.EMAIL.MESSAGE })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(USER_VALIDATION.USERNAME.MIN_LENGTH, { message: USER_VALIDATION.USERNAME.MIN_MESSAGE })
  @MaxLength(USER_VALIDATION.USERNAME.MAX_LENGTH, { message: USER_VALIDATION.USERNAME.MAX_MESSAGE })
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(USER_VALIDATION.PASSWORD.MIN_LENGTH, { message: USER_VALIDATION.PASSWORD.MESSAGE })
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(USER_VALIDATION.PASSWORD.MIN_LENGTH, { message: USER_VALIDATION.PASSWORD.MESSAGE })
  confirmPassword?: string;

  @IsOptional()
  @IsUrl({}, { message: USER_VALIDATION.IMAGE.MESSAGE })
  image?: string;

  @IsOptional()
  @IsString()
  @MaxLength(USER_VALIDATION.BIO.MAX_LENGTH, { message: USER_VALIDATION.BIO.MAX_MESSAGE })
  bio?: string;
}
