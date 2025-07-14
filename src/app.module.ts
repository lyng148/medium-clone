/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {APP_FILTER, APP_PIPE} from '@nestjs/core';
import {HttpExceptionFilter} from './common/filters/http-exception.filter';
import {ValidationPipe} from './common/pipes/validation.pipe';

@Module({
	imports: [],
	controllers: [AppController],
	providers: [
		AppService, 
		{
			provide: APP_FILTER,
			useClass: HttpExceptionFilter,
		},
		{
			provide: APP_PIPE,
			useClass: ValidationPipe
		},
		// {
		// 	provide: APP_GUARD,
		// 	useClass: RolesGuard
		// }
	],
})
export class AppModule {}
