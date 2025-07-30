import { ArticleStatus, User } from '../../generated/prisma/index';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import slugify from 'slugify';
import { PrismaService } from '../../prisma/prisma.service';
import { ListArticlesDto } from './dto/list-articles.dto';
import { I18nService } from '../i18n/i18n.service';
import { PublishArticlesDto } from './dto/publish-article.dto';
import { DraftArticlesResponseDto } from './dto/draft-articles-response.dto';
import { PublishArticlesResponseDto } from './dto/publish-articles-response.dto';
import {
  ArticleStatisticsResponseDTO,
  MonthlyStatistic,
} from './dto/article-statistic-response.dto';
import { MIN_INTERACTION } from './articles.constant';

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
      status: ArticleStatus.DRAFT,
      author: {
        connect: {
          id: author.id,
        },
      },
      ...(tagListData && { tagList: tagListData }),
    };

    const article = await this.prisma.article.create({
      data: articleData,
      include: this.getArticleIncludeOptions(),
    });

    return this.buildArticleResponse(author, article);
  }

  async getDraftArticles(currentUser: User): Promise<DraftArticlesResponseDto> {
    const articles = await this.prisma.article.findMany({
      where: {
        authorId: currentUser.id,
        status: 'DRAFT',
      },
      include: this.getArticleIncludeOptions(),
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return {
      articles: articles.map((article) => this.buildArticleResponse(currentUser, article)),
      articlesCount: articles.length,
    };
  }

  async publishArticles(
    currentUser: User,
    publishData: PublishArticlesDto,
    language?: string,
  ): Promise<PublishArticlesResponseDto> {
    // Check if all articles belong to the user and are in draft status
    const draftArticles = await this.prisma.article.findMany({
      where: {
        slug: { in: publishData.articleSlugs },
        authorId: currentUser.id,
        status: 'DRAFT',
      },
    });

    if (draftArticles.length !== publishData.articleSlugs.length) {
      throw new NotFoundException(
        this.i18nService.getArticleMessage('errors.someArticlesNotFound', language),
      );
    }

    // Publish all articles
    await this.prisma.article.updateMany({
      where: {
        slug: { in: publishData.articleSlugs },
        authorId: currentUser.id,
      },
      data: {
        status: 'PUBLISHED',
      },
    });

    return {
      message: this.i18nService.getArticleMessage('success.published', language, {
        count: draftArticles.length,
      }),
    };
  }
  async updateArticleStatus(currentUser: User, slug: string, status: ArticleStatus, lang?: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw new NotFoundException(this.i18nService.getArticleMessage('errors.notFound', lang));
    }

    const updatedArticle = await this.prisma.article.update({
      where: { slug },
      data: {
        status,
      },
      include: this.getArticleIncludeOptions(),
    });

    const author = await this.findArticleAuthor(article.authorId);

    return this.buildArticleResponse(author, updatedArticle);
  }

  async findOne(currUser: User, slug: string, lang?: string) {
    const article = await this.getArticleWithCounts({ slug });

    if (!article) {
      throw new BadRequestException(this.i18nService.getArticleMessage('errors.notFound', lang));
    }

    if (article.status === 'DRAFT' && (!currUser || article.authorId !== currUser.id)) {
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
      include: this.getArticleIncludeOptions(),
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

    const updatedArticle = await this.getArticleWithCounts({ id: article.id });

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

    const updatedArticle = await this.getArticleWithCounts({ id: article.id });

    return this.buildArticleResponse(author, updatedArticle);
  }

  async listArticles(listArticleDTO: ListArticlesDto, currUser?: User) {
    const whereClause: {
      tagList?: { some: { name: { in: string[] } } };
      author?: { username: { in: string[] } };
      favoritedBy?: { some: { username: string } };
      status: ArticleStatus;
    } = {
      status: ArticleStatus.PUBLISHED,
    };

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
            comments: true,
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
      favoritesCount: article._count.favoritedBy,
      commentCount: article._count.comments,
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

  async getArticleStatistics(
    currentUser: User,
    lang?: string,
  ): Promise<ArticleStatisticsResponseDTO> {
    const userInfo = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { createdAt: true },
    });

    if (!userInfo) {
      throw new UnauthorizedException(this.i18nService.getAuthMessage('errors.unauthorized'), lang);
    }

    const accountCreatedAt = userInfo.createdAt;
    const now = new Date();

    const articlesWithInteractions = await this.prisma.article.findMany({
      where: {
        authorId: currentUser.id,
        status: 'PUBLISHED',
        createdAt: {
          gte: accountCreatedAt,
          lte: now,
        },
      },
      select: {
        id: true,
        createdAt: true,
        _count: {
          select: {
            favoritedBy: true,
            comments: true,
          },
        },
      },
    });

    const qualifiedArticles = articlesWithInteractions.filter((article) => {
      const totalInteractions = article._count.favoritedBy + article._count.comments;
      return totalInteractions >= MIN_INTERACTION;
    });

    const monthlyStatisticsMap = new Map<string, MonthlyStatistic>();

    const startDate = new Date(accountCreatedAt.getFullYear(), accountCreatedAt.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];

      monthlyStatisticsMap.set(key, {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        monthName: monthNames[d.getMonth()],
        articlesCount: 0,
        totalInteractions: 0,
      });
    }

    qualifiedArticles.forEach((article) => {
      const articleDate = new Date(article.createdAt);
      const key = `${articleDate.getFullYear()}-${articleDate.getMonth() + 1}`;

      const stat = monthlyStatisticsMap.get(key);
      if (stat) {
        stat.articlesCount += 1;
        stat.totalInteractions += article._count.favoritedBy + article._count.comments;
      }
    });

    const statistics = Array.from(monthlyStatisticsMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    const totalArticles = qualifiedArticles.length;
    const totalInteractions = qualifiedArticles.reduce((sum, article) => {
      return sum + article._count.favoritedBy + article._count.comments;
    }, 0);

    return {
      statistics,
      totalArticles,
      totalInteractions,
      accountCreatedAt,
      periodStart: startDate,
      periodEnd: now,
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

  private buildArticleResponse(author: User, article: any) {
    const { password, createdAt, updatedAt, id, email, ...authorInfo } = author;
    // Remove JWT properties if they exist
    if ('iat' in authorInfo) delete (authorInfo as any).iat;
    if ('exp' in authorInfo) delete (authorInfo as any).exp;

    return {
      article: {
        ...article,
        favoritesCount: article._count?.favoritedBy || 0,
        commentCount: article._count?.comments || 0,
        author: authorInfo,
      },
    };
  }

  private getArticleIncludeOptions() {
    return {
      tagList: true,
      _count: {
        select: {
          favoritedBy: true,
          comments: true,
        },
      },
    };
  }

  private async getArticleWithCounts(where: { slug: string } | { id: number }) {
    return this.prisma.article.findUnique({
      where,
      include: this.getArticleIncludeOptions(),
    });
  }
}
