import { Body, Controller, Get, Post, Put, Delete, Param } from '@nestjs/common';
import { CreateUserDTO } from './dtos/create-user.dto';
import { UsersService } from './users.service';
import { Public } from 'src/auth/constants';
import { LoginUserDTO } from './dtos/login-user.dto';
import { User } from 'generated/prisma';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { UpdateUserValidationPipe } from 'src/common/pipes/update-user.pipe';
import { UpdateUserDto } from './dtos/update-user.dto';
import { Language } from '../i18n/decorators/language.decorator';

@Controller()
export class UsersController {
  constructor(private userService: UsersService) {}

  @Public()
  @Post('users')
  async register(@Body() createUserDTO: CreateUserDTO, @Language() lang: string) {
    return this.userService.createUser(createUserDTO, lang);
  }

  @Public()
  @Post('users/login')
  async login(@Body() loginUserDTO: LoginUserDTO, @Language() lang: string) {
    return this.userService.loginUser(loginUserDTO, lang);
  }

  @Get('user')
  getCurrentUser(@CurrentUser() user: User, @Language() lang: string) {
    return this.userService.getCurrentUser(user, lang);
  }

  @Put('user')
  updateUser(
    @CurrentUser() user: User,
    @Body(new UpdateUserValidationPipe()) updateUserDTO: UpdateUserDto,
    @Language() lang: string,
  ) {
    return this.userService.updateUser(user, updateUserDTO, lang);
  }

  @Public()
  @Get('profiles/:username')
  async getProfile(
    @Param('username') username: string,
    @CurrentUser() currentUser: User,
    @Language() lang: string,
  ) {
    return this.userService.getProfile(username, currentUser, lang);
  }

  @Post('profiles/:username/follow')
  async followUser(
    @CurrentUser() currUser: User,
    @Param('username') username: string,
    @Language() lang: string,
  ) {
    return this.userService.followUser(currUser, username, lang);
  }

  @Delete('profiles/:username/follow')
  async unfollowUser(
    @CurrentUser() currUser: User,
    @Param('username') username: string,
    @Language() lang: string,
  ) {
    return this.userService.unfollowUser(currUser, username, lang);
  }
}
