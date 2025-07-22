import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { I18nService } from '../i18n/i18n.service';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, I18nService],
})
export class CommentsModule {}
