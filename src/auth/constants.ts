import { SetMetadata } from '@nestjs/common';

export const jwtConstants = {
	secret: 'Very secret',
};
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
