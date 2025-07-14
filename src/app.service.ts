import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
	getHello(): string {
		const aisatu: string = 'anh em minh cu the thoi';
		return aisatu;
	}
}
