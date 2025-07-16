import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDTO } from './dtos/create-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginUserDTO } from './dtos/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { User } from 'generated/prisma';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async createUser(data: CreateUserDTO) {
    const emailExists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (emailExists) {
      throw new ConflictException(`User with email "${data.email}" already exists.`);
    }

    const usernameExists = await this.prisma.user.findUnique({
      where: { username: data.username },
    });
    if (usernameExists) {
      throw new ConflictException(`Username "${data.username}" is already taken.`);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    return this.buildUserResponse(user);
  }

  async loginUser(data: LoginUserDTO) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new UnauthorizedException('Invalid credential.');
    }

    return this.buildUserResponse(user);
  }

  async getCurrentUser(CurrentUser: User) {
    const user = await this.prisma.user.findUnique({
      where: { username: CurrentUser.username },
    });
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    return this.buildUserResponse(user);
  }

  async updateUser(currentUser: User, data: UpdateUserDto) {
    const updateData: UpdateUserDto = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    delete updateData.confirmPassword;
    const updatedUser = await this.prisma.user.update({
      where: { username: currentUser.username },
      data: updateData,
    });
    return this.buildUserResponse(updatedUser);
  }

  private buildUserResponse(user: User) {
    const payload = {
      email: user.email,
      username: user.username,
      bio: user.bio,
      image: user.image,
    };

    return {
      user: {
        email: user.email,
        token: this.jwtService.sign(payload),
        username: user.username,
        bio: user.bio,
        image: user.image,
      },
    };
  }
}
