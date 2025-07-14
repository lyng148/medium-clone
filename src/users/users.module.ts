import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthService } from 'src/auth/auth.service';

@Module({
	imports: [PrismaModule],
	providers: [UsersService, AuthService],
	exports: [UsersService],
	controllers: [UsersController],
})
export class UsersModule {}
