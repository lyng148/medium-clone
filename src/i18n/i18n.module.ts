import { Module } from '@nestjs/common';
import {
  I18nModule as BaseI18nModule,
  AcceptLanguageResolver,
  QueryResolver,
  HeaderResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import { I18nService } from './i18n.service';

@Module({
  imports: [
    BaseI18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(process.cwd(), 'dist/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),
  ],
  providers: [I18nService],
  exports: [I18nService],
})
export class I18nModule {}
