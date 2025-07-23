import { BadRequestException, Injectable } from '@nestjs/common';
import { User, Comment } from 'generated/prisma';
import { CreateCommentDTO } from './dto/create-comment.dto';
import { PrismaService } from 'prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private i18nService: I18nService,
  ) {}

  async createComment(
    currUser: User,
    slug: string,
    createCommentDTO: CreateCommentDTO,
    lang?: string,
  ) {
    const article = await this.prisma.article.findUnique({
      where: { slug: slug },
    });
    if (!article) {
      throw new BadRequestException(this.i18nService.getArticleMessage('errors.notFound', lang));
    }

    const comment = await this.prisma.comment.create({
      data: {
        body: createCommentDTO.body,
        author: {
          connect: {
            id: currUser.id,
          },
        },
        article: {
          connect: {
            id: article.id,
          },
        },
      },
      select: {
        id: true,
        body: true,
        authorId: true,
        articleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.buildCommentResponse(currUser, {
      id: comment.id,
      body: comment.body,
      authorId: comment.authorId,
      articleId: comment.articleId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    });
  }

  async getCommentFromArticle(slug: string, lang?: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug: slug },
    });

    if (!article) {
      throw new BadRequestException(this.i18nService.getArticleMessage('errors.notFound', lang));
    }

    const comments = await this.prisma.comment.findMany({
      where: { articleId: article.id },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        body: true,
        author: {
          select: {
            username: true,
            bio: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      comments: comments.map((comment) => ({
        comment: {
          id: comment.id,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          body: comment.body,
          author: comment.author,
        },
      })),
    };
  }

  delete(id: number) {
    return this.prisma.comment.delete({
      where: { id: id },
    });
  }

  private buildCommentResponse(user: User, comment: Comment) {
    const { email, id, ...authorInfo } = user;
    if ('iat' in authorInfo) delete authorInfo.iat;
    if ('exp' in authorInfo) delete authorInfo.exp;

    return {
      comment: {
        ...comment,
        author: authorInfo,
      },
    };
  }
}
