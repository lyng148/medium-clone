import { IsEmail, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
	@IsOptional()
	@IsEmail({}, { message: 'Please provide a valid email address' })
	email?: string;

	@IsOptional()
	@IsString()
	@MinLength(3, { message: 'Username must be at least 3 characters long' })
	@MaxLength(20, { message: 'Username cannot exceed 20 characters' })
	username?: string;

	@IsOptional()
	@IsString()
	@MinLength(6, { message: 'Password must be at least 6 characters long' })
	password?: string;

	@IsOptional()
	@IsString()
	@MinLength(6, { message: 'Password must be at least 6 characters long' })
	confirmPassword?: string;

	@IsOptional()
	@IsUrl({}, { message: 'Image must be a valid URL' })
	image?: string;

	@IsOptional()
	@IsString()
	@MaxLength(500, { message: 'Bio cannot exceed 500 characters' })
	bio?: string;
}
