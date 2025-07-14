import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDTO } from './dtos/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) {}

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

		return await this.prisma.user.create({
			data: {
				...data,
				password: hashedPassword,
			},

			select: {
				id: true,
				email: true,
				username: true,
				bio: true,
				image: true,
				createdAt: true,
				updatedAt: true,
			},
		});
	}
}
