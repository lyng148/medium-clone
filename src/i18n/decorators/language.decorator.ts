import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Language = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();

  if (request.query?.lang) {
    return request.query.lang as string;
  }

  if (request.headers['x-lang']) {
    return request.headers['x-lang'] as string;
  }

  const acceptLanguage = request.headers['accept-language'];
  if (acceptLanguage) {
    const primaryLang = (acceptLanguage as string).split(',')[0].split('-')[0];
    return ['en', 'vi'].includes(primaryLang) ? primaryLang : 'en';
  }

  return 'en';
});
