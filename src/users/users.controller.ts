import { Body, Controller, Get, Post, Put, Delete, Param } from '@nestjs/common';
import { CreateUserDTO } from './dtos/create-user.dto';
import { UsersService } from './users.service';
import { Public } from 'src/auth/constants';
import { LoginUserDTO } from './dtos/login-user.dto';
import { User } from 'generated/prisma';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { UpdateUserValidationPipe } from 'src/common/pipes/update-user.pipe';
import { UpdateUserDto } from './dtos/update-user.dto';

@Controller()
export class UsersController {
  constructor(private userService: UsersService) {}

  @Public()
  @Post('users')
  async register(@Body() createUserDTO: CreateUserDTO) {
    return this.userService.createUser(createUserDTO);
  }

  @Public()
  @Post('users/login')
  async login(@Body() loginUserDTO: LoginUserDTO) {
    return this.userService.loginUser(loginUserDTO);
  }

  @Get('user')
  getCurrentUser(@CurrentUser() user: User) {
    return this.userService.getCurrentUser(user);
  }

  @Put('user')
  updateUser(
    @CurrentUser() user: User,
    @Body(new UpdateUserValidationPipe()) updateUserDTO: UpdateUserDto,
  ) {
    return this.userService.updateUser(user, updateUserDTO);
  }

  @Public()
  @Get('profiles/:username')
  async getProfile(@Param('username') username: string, @CurrentUser() currentUser?: User) {
    return this.userService.getProfile(username, currentUser);
  }

  @Post('profiles/:username/follow')
  async followUser(@CurrentUser() currUser: User, @Param('username') username: string) {
    return this.userService.followUser(currUser, username);
  }

  @Delete('profiles/:username/follow')
  async unfollowUser(@CurrentUser() currUser: User, @Param('username') username: string) {
    return this.userService.unfollowUser(currUser, username);
  }
}
