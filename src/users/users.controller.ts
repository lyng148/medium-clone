import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CreateUserDTO } from './dtos/create-user.dto';
import { UsersService } from './users.service';
import { Public } from 'src/auth/constants';
import { LoginUserDTO } from './dtos/login-user.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('users')
export class UsersController {
	constructor(private userService: UsersService) {}

	@Public()
	@Post()
	async register(@Body() createUserDTO: CreateUserDTO) {
		return this.userService.createUser(createUserDTO);
	}

	@Public()
	@Post('login')
	async login(@Body() loginUserDTO: LoginUserDTO) {
		return this.userService.loginUser(loginUserDTO);
	}

	@UseGuards(AuthGuard)
	@Get()
	hello() {
		return 'd';
	}
}
