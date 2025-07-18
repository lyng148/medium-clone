import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { CreateCommentDTO } from './dto/create-comment.dto';
import { User } from 'generated/prisma';
import { Public } from 'src/auth/constants';
import { CommentOwnerGuard } from 'src/common/guards/comment-owner.guard';

@Controller('articles')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':slug/comments')
  async create(
    @CurrentUser() currUser: User,
    @Param('slug') slug: string,
    @Body() createCommentDTO: CreateCommentDTO,
  ) {
    return await this.commentsService.create(currUser, slug, createCommentDTO);
  }

  @Public()
  @Get(':slug/comments')
  async getFromArticle(@Param('slug') slug: string) {
    return await this.commentsService.getFromArticle(slug);
  }

  @UseGuards(CommentOwnerGuard)
  @Delete(':slug/comments/:id')
  delete(@Param('slug') slug: string, @Param('id', new ParseIntPipe()) id: number) {
    return this.commentsService.delete(id);
  }
}
