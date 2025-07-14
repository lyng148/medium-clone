import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { abortOnError: false });
	const configService = app.get(ConfigService);
	app.setGlobalPrefix('api');
	const port = configService.get<number>('PORT') || 3000;
	await app.listen(port);
}
bootstrap().catch((err) => {
	console.log(err);
});
