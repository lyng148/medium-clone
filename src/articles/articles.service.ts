import { Article, User } from './../../generated/prisma/index.d';
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import slugify from 'slugify';
import { PrismaService } from '../../prisma/prisma.service';
import { ListArticlesDto } from './dto/list-articles.dto';
import { I18nService } from '../i18n/i18n.service';

interface TagListOperations {
  connect: { id: number }[];
  create: { name: string }[];
}

@Injectable()
export class ArticlesService {
  constructor(
    private prisma: PrismaService,
    private i18nService: I18nService,
  ) {}

  async create(currUser: User, createArticleDto: CreateArticleDto, lang?: string) {
    const slug = slugify(createArticleDto.title, {
      lower: true,
      strict: true,
    });

    const existedArticle = await this.prisma.article.findUnique({
      where: { slug: slug },
    });

    if (existedArticle) {
      throw new ConflictException(
        this.i18nService.getArticleMessage('errors.titleExists', lang, {
          title: createArticleDto.title,
        }),
      );
    }

    const author = await this.prisma.user.findUnique({
      where: { username: currUser.username },
    });

    if (!author) {
      throw new Error(this.i18nService.getUserMessage('errors.notFound', lang));
    }

    let tagListData: TagListOperations | undefined;
    if (createArticleDto.tagList?.length) {
      const existingTags = await this.prisma.tag.findMany({
        where: {
          name: {
            in: createArticleDto.tagList,
          },
        },
      });

      const existingTagNames = existingTags.map((tag) => tag.name);

      const newTagNames = createArticleDto.tagList.filter(
        (tagName) => !existingTagNames.includes(tagName),
      );

      tagListData = {
        connect: existingTags.map((tag) => ({ id: tag.id })),
        create: newTagNames.map((name) => ({ name })),
      };
    }

    const articleData = {
      title: createArticleDto.title,
      description: createArticleDto.description,
      body: createArticleDto.body,
      slug: slug,
      author: {
        connect: {
          id: author.id,
        },
      },
      ...(tagListData && { tagList: tagListData }),
    };

    const article = await this.prisma.article.create({
      data: articleData,
      include: {
        tagList: true,
      },
    });

    return this.buildArticleResponse(author, article);
  }

  async findOne(slug: string, lang?: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug: slug },
    });

    if (!article) {
      throw new BadRequestException(this.i18nService.getArticleMessage('errors.notFound', lang));
    }

    const author = await this.findArticleAuthor(article.authorId);

    return this.buildArticleResponse(author, article);
  }

  async update(currUser: User, slug: string, updateArticleDto: UpdateArticleDto, lang?: string) {
    if (updateArticleDto.title) {
      const newSlug = slugify(updateArticleDto.title, {
        lower: true,
        strict: true,
      });

      const existingArticle = await this.prisma.article.findUnique({
        where: { slug: newSlug },
      });

      if (existingArticle && existingArticle.slug !== slug) {
        throw new ConflictException(
          this.i18nService.getArticleMessage('errors.titleExists', lang, {
            title: updateArticleDto.title,
          }),
        );
      }

      updateArticleDto.slug = newSlug;
    }

    const article = await this.prisma.article.update({
      where: { slug: slug },
      data: updateArticleDto,
      include: {
        tagList: true,
      },
    });

    return this.buildArticleResponse(currUser, article);
  }

  remove(slug: string) {
    return this.prisma.article.delete({
      where: { slug: slug },
    });
  }

  async favoriteArticle(currUser: User, slug: string, lang?: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug: slug },
    });

    if (!article) {
      throw new BadRequestException(this.i18nService.getArticleMessage('errors.notFound', lang));
    }

    const userWithFavorites = await this.prisma.user.findUnique({
      where: { id: currUser.id },
      include: {
        favorites: {
          where: {
            slug: slug,
          },
        },
      },
    });

    if (userWithFavorites?.favorites.length) {
      throw new BadRequestException(
        this.i18nService.getArticleMessage('errors.alreadyFavorited', lang),
      );
    }

    const author = await this.findArticleAuthor(article.authorId);

    if (!author) {
      throw new BadRequestException(
        this.i18nService.getArticleMessage('errors.authorNotFound', lang),
      );
    }

    await this.prisma.user.update({
      where: { id: currUser.id },
      data: {
        favorites: {
          connect: {
            id: article.id,
          },
        },
      },
    });

    const updatedArticle = await this.prisma.article.update({
      where: { id: article.id },
      data: {
        favoriteCount: {
          increment: 1,
        },
      },
      include: {
        tagList: true,
      },
    });

    return this.buildArticleResponse(author, updatedArticle);
  }

  async unfavoriteArticle(currUser: User, slug: string, lang?: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug: slug },
    });

    if (!article) {
      throw new BadRequestException(this.i18nService.getArticleMessage('errors.notFound', lang));
    }

    const userWithFavorites = await this.prisma.user.findUnique({
      where: { id: currUser.id },
      include: {
        favorites: {
          where: {
            id: article.id,
          },
        },
      },
    });

    if (!userWithFavorites?.favorites.length) {
      throw new BadRequestException(
        this.i18nService.getArticleMessage('errors.notFavorited', lang),
      );
    }

    const author = await this.findArticleAuthor(article.authorId);

    if (!author) {
      throw new BadRequestException(
        this.i18nService.getArticleMessage('errors.authorNotFound', lang),
      );
    }

    await this.prisma.user.update({
      where: { id: currUser.id },
      data: {
        favorites: {
          disconnect: {
            id: article.id,
          },
        },
      },
    });

    const updatedArticle = await this.prisma.article.update({
      where: { id: article.id },
      data: {
        favoriteCount: {
          decrement: 1,
        },
      },
      include: {
        tagList: true,
      },
    });

    return this.buildArticleResponse(author, updatedArticle);
  }

  async listArticles(listArticleDTO: ListArticlesDto, currUser?: User) {
    const whereClause: any = {};

    if (listArticleDTO.tag) {
      const tags = listArticleDTO.tag.split(',').map((tag) => tag.trim());

      whereClause.tagList = {
        some: {
          name: {
            in: tags,
          },
        },
      };
    }

    if (listArticleDTO.author) {
      const authors = listArticleDTO.author.split(',').map((author) => author.trim());

      whereClause.author = {
        username: {
          in: authors,
        },
      };
    }

    if (listArticleDTO.favorited) {
      whereClause.favoritedBy = {
        some: {
          username: listArticleDTO.favorited,
        },
      };
    }

    const articles = await this.prisma.article.findMany({
      where: whereClause,
      select: {
        slug: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        commentCount: true,
        favoriteCount: true,
        tagList: {
          select: {
            name: true,
          },
        },
        author: {
          select: {
            username: true,
            bio: true,
            image: true,
          },
        },
        favoritedBy: currUser
          ? {
              where: {
                id: currUser.id,
              },
              select: {
                id: true,
              },
            }
          : false,
        _count: {
          select: {
            favoritedBy: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: listArticleDTO.limit || 20,
      skip: listArticleDTO.offset || 0,
    });

    const transformedArticles = articles.map((article) => ({
      slug: article.slug,
      title: article.title,
      description: article.description,
      tagList: article.tagList.map((tag) => tag.name),
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited: currUser ? article.favoritedBy.length > 0 : false,
      favoritesCount: article.favoriteCount,
      commentCount: article.commentCount,
      author: {
        ...article.author,
        following: false,
      },
    }));

    return {
      articles: transformedArticles,
      articlesCount: transformedArticles.length,
      limit: listArticleDTO.limit || 20,
      offset: listArticleDTO.offset || 0,
    };
  }

  private async findArticleAuthor(authorId: number): Promise<User> {
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
    });

    if (!author) {
      throw new Error('Author not found - this should not happen:<');
    }

    return author;
  }

  private buildArticleResponse(author: User, article: Article) {
    const { password, createdAt, updatedAt, id, email, ...authorInfo } = author;
    if ('iat' in authorInfo) delete authorInfo.iat;
    if ('exp' in authorInfo) delete authorInfo.exp;

    return {
      article: {
        ...article,
        favoritesCount: article.favoriteCount,
        author: authorInfo,
      },
    };
  }
}
