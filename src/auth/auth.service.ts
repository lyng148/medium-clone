import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
	constructor(
		private userService: UsersService,
		private jwtService: JwtService,
	) {}

	// async login(email: string, pass: string): Promise<{ access_token: string }> {
	// 	// const user = await this.userService.findOne(email);
	// 	// if (user?.password !== pass) {
	// 	// 	throw new UnauthorizedException();
	// 	// }

	// 	// const payload = { sub: user.userId, email: user.email };
	// 	// return { access_token: await this.jwtService.signAsync(payload) };
	// }
}
