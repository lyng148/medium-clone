import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { CreateUserDTO } from './dtos/create-user.dto';
import { UsersService } from './users.service';
import { Public } from 'src/auth/constants';
import { LoginUserDTO } from './dtos/login-user.dto';
import { User } from 'generated/prisma';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { UpdateUserValidationPipe } from 'src/common/pipes/update-user.pipe';
import { UpdateUserDto } from './dtos/update-user.dto';

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

  @Get()
  getCurrentUser(@CurrentUser() user: User) {
    return this.userService.getCurrentUser(user);
  }

  @Put()
  updateUser(
    @CurrentUser() user: User,
    @Body(new UpdateUserValidationPipe()) updateUserDTO: UpdateUserDto,
  ) {
    return this.userService.updateUser(user, updateUserDTO);
  }
}
