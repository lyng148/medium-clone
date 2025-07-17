import { IsOptional, IsString } from 'class-validator';

export class UpdateArticleDto {
  [x: string]: string;
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  body: string;
}
