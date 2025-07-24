import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ListArticlesDto } from './dto/list-articles.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { User } from 'generated/prisma';
import { ArticleOwnerGuard } from 'src/common/guards/article-owner.guard';
import { Public } from 'src/auth/constants';
import { Language } from '../i18n/decorators/language.decorator';
import { PublishArticlesDto } from './dto/publish-article.dto';
import { DraftArticlesResponseDto } from './dto/draft-articles-response.dto';
import { PublishArticlesResponseDto } from './dto/publish-articles-response.dto';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  create(
    @CurrentUser() currUser: User,
    @Body() createArticleDto: CreateArticleDto,
    @Language() lang: string,
  ) {
    return this.articlesService.create(currUser, createArticleDto, lang);
  }

  @Get('drafts')
  getDraftArticles(@CurrentUser() currentUser: User): Promise<DraftArticlesResponseDto> {
    return this.articlesService.getDraftArticles(currentUser);
  }

  @Get(':slug')
  findOne(@CurrentUser() currUser: User, @Param('slug') slug: string, @Language() lang: string) {
    return this.articlesService.findOne(currUser, slug, lang);
  }

  @Put(':slug')
  @UseGuards(ArticleOwnerGuard)
  update(
    @CurrentUser() currUser: User,
    @Param('slug') slug: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @Language() lang: string,
  ) {
    return this.articlesService.update(currUser, slug, updateArticleDto, lang);
  }

  @Delete(':slug')
  @UseGuards(ArticleOwnerGuard)
  remove(@Param('slug') slug: string) {
    return this.articlesService.remove(slug);
  }

  @Post(':slug/favorite')
  favoriteArticle(
    @CurrentUser() currUser: User,
    @Param('slug') slug: string,
    @Language() lang: string,
  ) {
    return this.articlesService.favoriteArticle(currUser, slug, lang);
  }

  @Delete(':slug/favorite')
  unfavoriteArticle(
    @CurrentUser() currUser: User,
    @Param('slug') slug: string,
    @Language() lang: string,
  ) {
    return this.articlesService.unfavoriteArticle(currUser, slug, lang);
  }

  @Public()
  @Get()
  listArticles(@Query() listArticlesDto: ListArticlesDto, @CurrentUser() currUser?: User) {
    return this.articlesService.listArticles(listArticlesDto, currUser);
  }

  @Post('publish')
  publishArticles(
    @CurrentUser() currentUser: User,
    @Body() publishData: PublishArticlesDto,
    @Language() language: string,
  ): Promise<PublishArticlesResponseDto> {
    return this.articlesService.publishArticles(currentUser, publishData, language);
  }

  @Patch(':slug/status')
  @UseGuards(ArticleOwnerGuard)
  updateArticleStatus(
    @CurrentUser() currentUser: User,
    @Param('slug') slug: string,
    @Body('status') status: 'DRAFT' | 'PUBLISHED',
    @Language() lang: string,
  ) {
    return this.articlesService.updateArticleStatus(currentUser, slug, status, lang);
  }
}
