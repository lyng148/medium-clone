export class MonthlyStatistic {
  year: number;
  month: number;
  monthName: string;
  articlesCount: number;
  totalInteractions: number;
}

export class ArticleStatisticsResponseDTO {
  statistics: MonthlyStatistic[];
  totalArticles: number;
  totalInteractions: number;
  accountCreatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
}
