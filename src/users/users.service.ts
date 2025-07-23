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
import { I18nService } from '../i18n/i18n.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private i18nService: I18nService,
  ) {}

  async createUser(data: CreateUserDTO, lang?: string) {
    const emailExists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (emailExists) {
      throw new ConflictException(
        this.i18nService.getUserMessage('errors.emailExists', lang, { email: data.email }),
      );
    }

    const usernameExists = await this.prisma.user.findUnique({
      where: { username: data.username },
    });
    if (usernameExists) {
      throw new ConflictException(
        this.i18nService.getUserMessage('errors.usernameExists', lang, { username: data.username }),
      );
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

  async loginUser(data: LoginUserDTO, lang?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new UnauthorizedException(
        this.i18nService.getAuthMessage('errors.invalidCredentials', lang),
      );
    }

    return this.buildUserResponse(user);
  }

  async getCurrentUser(CurrentUser: User, lang?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: CurrentUser.username },
    });
    if (!user) {
      throw new UnauthorizedException(this.i18nService.getUserMessage('errors.notFound', lang));
    }
    return this.buildUserResponse(user);
  }

  async updateUser(currentUser: User, data: UpdateUserDto, lang?: string) {
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

  async getProfile(username: string, currentUser?: User, lang?: string) {
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
      throw new NotFoundException(
        this.i18nService.getUserMessage('errors.profileNotFound', lang, { username }),
      );
    }

    return this.buildProfileResponse(user, currentUser);
  }

  async followUser(currentUser: User, targetUsername: string, lang?: string) {
    if (currentUser.username === targetUsername) {
      throw new ConflictException(this.i18nService.getUserMessage('errors.cannotFollowSelf', lang));
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) {
      throw new NotFoundException(
        this.i18nService.getUserMessage('errors.profileNotFound', lang, {
          username: targetUsername,
        }),
      );
    }

    const existingFollow = await this.prisma.user.findFirst({
      where: {
        id: currentUser.id,
        following: {
          some: { id: targetUser.id },
        },
      },
    });

    if (existingFollow) {
      throw new ConflictException(
        this.i18nService.getUserMessage('errors.alreadyFollowing', lang, {
          username: targetUsername,
        }),
      );
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

  async unfollowUser(currentUser: User, targetUsername: string, lang?: string) {
    if (currentUser.username === targetUsername) {
      throw new ConflictException(
        this.i18nService.getUserMessage('errors.cannotUnfollowSelf', lang),
      );
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) {
      throw new NotFoundException(
        this.i18nService.getUserMessage('errors.profileNotFound', lang, {
          username: targetUsername,
        }),
      );
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
      throw new ConflictException(
        this.i18nService.getUserMessage('errors.notFollowing', lang, { username: targetUsername }),
      );
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
