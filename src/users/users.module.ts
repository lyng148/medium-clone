import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthService } from 'src/auth/auth.service';
import { I18nService } from '../i18n/i18n.service';

@Module({
  imports: [PrismaModule],
  providers: [UsersService, AuthService, I18nService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
