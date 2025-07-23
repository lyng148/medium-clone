import { IsArray, IsOptional, IsString } from 'class-validator';

export class PublishArticlesDto {
  @IsArray()
  @IsString({ each: true })
  articleSlugs: string[];
}

export class UpdateArticleStatusDto {
  @IsOptional()
  @IsString()
  status?: 'DRAFT' | 'PUBLISHED';
}
