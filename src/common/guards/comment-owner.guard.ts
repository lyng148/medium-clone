import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {User} from 'generated/prisma';
import {PrismaService} from 'prisma/prisma.service';

@Injectable()
export class CommentOwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const currUser: User = request.user;
    const articleSlug = request.params.slug as string;
    const commentId = parseInt(request.params.id as string, 10);

    if (isNaN(commentId)) {
      throw new BadRequestException('Invalid comment ID');
    }

    if (!currUser) {
      throw new ForbiddenException('Unauthorized');
    }

    const article = await this.prisma.article.findUnique({
      where: {slug: articleSlug},
    });

    if (!article) {
      throw new BadRequestException('Article not found');
    }

    const comment = await this.prisma.comment.findUnique({
      where: {id: commentId},
    });

    if (!comment) {
      throw new BadRequestException('Comment not found');
    }

    if (comment.authorId !== currUser.id) {
      throw new ForbiddenException('You are not authorized to modify this comment');
    }
    return true;
  }
}
