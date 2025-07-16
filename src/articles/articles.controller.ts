import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Query } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { User } from 'generated/prisma';
import { ArticleOwnerGuard } from 'src/common/guards/article-owner.guard';
import { Public } from 'src/auth/constants';
import { ListArticlesDto } from './dto/list-articles.dto';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  create(@CurrentUser() currUser: User, @Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(currUser, createArticleDto);
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.articlesService.findOne(slug);
  }

  @Put(':slug')
  @UseGuards(ArticleOwnerGuard)
  update(
    @CurrentUser() currUser: User,
    @Param('slug') slug: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.update(currUser, slug, updateArticleDto);
  }

  @Delete(':slug')
  @UseGuards(ArticleOwnerGuard)
  remove(@Param('slug') slug: string) {
    return this.articlesService.remove(slug);
  }

  @Post(':slug/favorite')
  favoriteArticle(@CurrentUser() currUser: User, @Param('slug') slug: string) {
    return this.articlesService.favoriteArticle(currUser, slug);
  }

  @Delete(':slug/favorite')
  unfavoriteArticle(@CurrentUser() currUser: User, @Param('slug') slug: string) {
    return this.articlesService.unfavoriteArticle(currUser, slug);
  }
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> b84e908 (feat(articles): add list articles functionality with filtering options)

  @Public()
  @Get()
  listArticles(@Query() listArticlesDto: ListArticlesDto, @CurrentUser() currUser?: User) {
    return this.articlesService.listArticles(listArticlesDto, currUser);
  }
<<<<<<< HEAD
=======
>>>>>>> 123c528 (feat(article): add favorite and unfavorite functionality for articles)
=======
>>>>>>> b84e908 (feat(articles): add list articles functionality with filtering options)
}
