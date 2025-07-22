import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { I18nService } from '../i18n/i18n.service';

@Module({
  imports: [PrismaModule],
  controllers: [ArticlesController],
  providers: [ArticlesService, I18nService],
})
export class ArticlesModule {}
