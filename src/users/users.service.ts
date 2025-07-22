import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDTO } from './dtos/create-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginUserDTO } from './dtos/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../generated/prisma';
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

  async getProfile(username: string, currentUser?: User) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        followedBy: currentUser
          ? {
              where: { id: currentUser.id },
            }
          : false,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with username "${username}" not found.`);
    }

    return this.buildProfileResponse(user, currentUser);
  }

  async followUser(currentUser: User, targetUsername: string) {
    if (currentUser.username === targetUsername) {
      throw new ConflictException('You cannot follow yourself.');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) {
      throw new NotFoundException(`User with username "${targetUsername}" not found.`);
    }

    // Check if already following
    const existingFollow = await this.prisma.user.findFirst({
      where: {
        id: currentUser.id,
        following: {
          some: { id: targetUser.id },
        },
      },
    });

    if (existingFollow) {
      throw new ConflictException(`You are already following ${targetUsername}.`);
    }

    await this.prisma.user.update({
      where: { id: currentUser.id },
      data: {
        following: {
          connect: { id: targetUser.id },
        },
      },
    });

    const updatedTargetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername },
      include: {
        followedBy: {
          where: { id: currentUser.id },
        },
      },
    });

    return this.buildProfileResponse(updatedTargetUser!, currentUser);
  }

  async unfollowUser(currentUser: User, targetUsername: string) {
    if (currentUser.username === targetUsername) {
      throw new ConflictException('You cannot unfollow yourself.');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) {
      throw new NotFoundException(`User with username "${targetUsername}" not found.`);
    }

    // Check if currently following
    const existingFollow = await this.prisma.user.findFirst({
      where: {
        id: currentUser.id,
        following: {
          some: { id: targetUser.id },
        },
      },
    });

    if (!existingFollow) {
      throw new ConflictException(`You are not following ${targetUsername}.`);
    }

    await this.prisma.user.update({
      where: { id: currentUser.id },
      data: {
        following: {
          disconnect: { id: targetUser.id },
        },
      },
    });

    const updatedTargetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername },
      include: {
        followedBy: {
          where: { id: currentUser.id },
        },
      },
    });

    return this.buildProfileResponse(updatedTargetUser!, currentUser);
  }

  private buildUserResponse(user: User) {
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      bio: user.bio,
      image: user.image,
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        token: this.jwtService.sign(payload),
        username: user.username,
        bio: user.bio,
        image: user.image,
      },
    };
  }

  private buildProfileResponse(user: User & { followedBy?: User[] }, currentUser?: User) {
    const isFollowing = currentUser ? user.followedBy && user.followedBy.length > 0 : false;

    return {
      profile: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following: isFollowing,
      },
    };
  }
}
