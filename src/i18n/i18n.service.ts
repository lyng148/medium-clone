import { Injectable } from '@nestjs/common';
import { I18nService as BaseI18nService } from 'nestjs-i18n';

@Injectable()
export class I18nService {
  constructor(private readonly i18n: BaseI18nService) {}

  translate(
    key: string,
    options?: {
      lang?: string;
      args?: Record<string, any>;
    },
  ): string {
    return this.i18n.translate(key, {
      lang: options?.lang || 'en',
      args: options?.args,
    });
  }

  getArticleMessage(key: string, lang?: string, args?: Record<string, any>): string {
    return this.translate(`article.${key}`, { lang, args });
  }

  getAuthMessage(key: string, lang?: string, args?: Record<string, any>): string {
    return this.translate(`auth.${key}`, { lang, args });
  }

  getCommentMessage(key: string, lang?: string, args?: Record<string, any>): string {
    return this.translate(`comment.${key}`, { lang, args });
  }

  getUserMessage(key: string, lang?: string, args?: Record<string, any>): string {
    return this.translate(`user.${key}`, { lang, args });
  }
}
