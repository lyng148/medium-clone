import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDTO } from './dtos/create-user.dto';
import { UsersService } from './users.service';
import { Public } from 'src/auth/constants';

@Controller('users')
export class UsersController {
	constructor(private userService: UsersService) {}

	@Public()
	@Post()
	async register(@Body() createUserDTO: CreateUserDTO) {
		return this.userService.createUser(createUserDTO);
	}
}
