import { Article, User } from './../../generated/prisma/index.d';
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import slugify from 'slugify';
import { PrismaService } from '../../prisma/prisma.service';

interface TagListOperations {
  connect: { id: number }[];
  create: { name: string }[];
}

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}
  async create(currUser: User, createArticleDto: CreateArticleDto) {
    const slug = slugify(createArticleDto.title, {
      lower: true,
      strict: true,
    });

    const existedArticle = await this.prisma.article.findUnique({
      where: { slug: slug },
    });

    if (existedArticle) {
      throw new ConflictException(`Article with title "${createArticleDto.title}" already exists`);
    }

    const author = await this.prisma.user.findUnique({
      where: { username: currUser.username },
    });

    if (!author) {
      throw new Error('User not found');
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

  async findOne(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug: slug },
    });

    if (!article) {
      throw new BadRequestException('Article not found');
    }

    const author = await this.findArticleAuthor(article.authorId);

    if (!author) {
      return {
        article: {
          ...article,
          author: null,
        },
      };
    }

    return this.buildArticleResponse(author, article);
  }

  async update(currUser: User, slug: string, updateArticleDto: UpdateArticleDto) {
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
          `Article with title "${updateArticleDto.title}" already exists`,
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

  async favoriteArticle(currUser: User, slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug: slug },
    });

    if (!article) {
      throw new BadRequestException('Article not found');
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
      throw new BadRequestException('Already favorited this article');
    }

    const author = await this.findArticleAuthor(article.authorId);

    if (!author) {
      throw new BadRequestException('Article author not found');
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

    return this.buildArticleResponse(author, article);
  }

  async unfavoriteArticle(currUser: User, slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug: slug },
    });

    if (!article) {
      throw new BadRequestException('Article not found');
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
      throw new BadRequestException('Article not favorited yet');
    }

    const author = await this.findArticleAuthor(article.authorId);

    if (!author) {
      throw new BadRequestException('Article author not found');
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

    return this.buildArticleResponse(author, article);
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
        author: authorInfo,
      },
    };
  }
}
