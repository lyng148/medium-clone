import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nService } from '../../i18n/i18n.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18nService: I18nService) {}

  // tach ra trog tuong lai
  // dang phai xu ly qua nhiu exception
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Get language from request
    const lang = this.getLanguageFromRequest(request);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      message =
        typeof exceptionResponse === 'object' && exceptionResponse.message
          ? exceptionResponse.message
          : exception.message;

      if (typeof message === 'string' && message.includes('.')) {
        try {
          const translatedMessage = this.i18nService.translate(message, { lang });
          if (translatedMessage !== message) {
            message = translatedMessage;
          }
        } catch (error) {}
      }
    } else if (exception instanceof Error) {
      message = exception.message || 'Unknown error';
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }

  private getLanguageFromRequest(request: Request): string {
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
  }
}
