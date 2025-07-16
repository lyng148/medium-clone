import {BadRequestException, Delete, Injectable} from '@nestjs/common';
import {User, Comment} from 'generated/prisma';
import {CreateCommentDTO} from './dto/create-comment.dto';
import {PrismaService} from 'prisma/prisma.service';
import {connect} from 'http2';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) { }
  async createComment(currUser: User, slug: string, createCommentDTO: CreateCommentDTO) {
    const article = await this.prisma.article.findUnique({
      where: {slug: slug},
    });
    if (!article) {
      throw new BadRequestException('Article not found');
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
        createdAt: true,
        updatedAt: true,
        body: true,
        authorId: true,
        articleId: true,
      },
    });
    console.log(comment);

    return this.buildCommentResponse(currUser, comment);
  }

  async getCommentFromArticle(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: {slug: slug},
    });

    if (!article) {
      throw new BadRequestException('Article not found');
    }

    const comments = await this.prisma.comment.findMany({
      where: {articleId: article.id},
    });

    console.log(comments);

    const commentPromises = comments.map(async (comment) => {
      const author = await this.prisma.user.findUnique({
        where: {id: comment.authorId},
      });
      if (!author) {
        return {
          ...comment,
          author: null,
        };
      }
      return {
          ...comment,
          author: author,
        };
    });

    return Promise.all(commentPromises);
  }

  deleteComment(id: number){
    return this.prisma.comment.delete({
      where: {id: id}
    })
  }

  private buildCommentResponse(user: User, comment: Comment) {
    const {email, id, ...authorInfo} = user;
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
