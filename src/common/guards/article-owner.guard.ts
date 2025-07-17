import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { User } from 'generated/prisma';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ArticleOwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const currUser: User = request.user;
    const articleSlug = request.params.slug;

    if (!currUser) {
      throw new ForbiddenException('Unauthorized');
    }

    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
    });

    if (!article) {
      throw new BadRequestException('Article not found');
    }

    if (article.authorId !== currUser.id) {
      throw new ForbiddenException('You are not authorized to modify this article');
    }
    return true;
  }
}
