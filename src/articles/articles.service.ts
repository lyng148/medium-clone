import { Article, User } from './../../generated/prisma/index.d';
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import slugify from 'slugify';
import { PrismaService } from '../../prisma/prisma.service';

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

    let tagListData: { connect: { id: number }[]; create: { name: string }[] } | undefined;
    if (createArticleDto.tagList && createArticleDto.tagList.length > 0) {
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

    const article = await this.prisma.article.create({
      data: {
        title: createArticleDto.title,
        description: createArticleDto.description,
        body: createArticleDto.body,
        slug: slug,
        tagList: tagListData
          ? {
              connect: tagListData.connect,
              create: tagListData.create,
            }
          : undefined,
        author: {
          connect: {
            id: author.id,
          },
        },
      },
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

    const author = await this.prisma.user.findUnique({
      where: { id: article.authorId },
    });

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
      updateArticleDto.slug = slugify(updateArticleDto.title, {
        lower: true,
        strict: true,
      });
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
