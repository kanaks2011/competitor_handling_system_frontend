export type SourceType =
  | 'WEBSITE'
  | 'PRICING'
  | 'BLOG'
  | 'LINKEDIN'
  | 'FACEBOOK'
  | 'ADS'
  | 'NEWSLETTER'
  | 'PRESS_RELEASE';

export const SOURCE_TYPES: { label: string; value: SourceType }[] = [
  { label: 'Website', value: 'WEBSITE' },
  { label: 'Pricing', value: 'PRICING' },
  { label: 'Blog', value: 'BLOG' },
  { label: 'LinkedIn', value: 'LINKEDIN' },
  { label: 'Facebook', value: 'FACEBOOK' },
  { label: 'Ads', value: 'ADS' },
  { label: 'Newsletter', value: 'NEWSLETTER' },
  { label: 'Press Release', value: 'PRESS_RELEASE' },
];

export type CrawlJobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';

export interface CompetitorSummary {
  id: number;
  name: string;
  websiteUrl: string | null;
  active: boolean;
  sourceCount: number;
  lastCrawlStatus: CrawlJobStatus | null;
  lastCrawledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Source {
  id: number;
  sourceType: SourceType;
  sourceUrl: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitorDetail {
  id: number;
  name: string;
  websiteUrl: string | null;
  description: string | null;
  active: boolean;
  sources: Source[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompetitorRequest {
  name: string;
  websiteUrl?: string;
  description?: string;
  active?: boolean;
}

export interface UpdateCompetitorRequest {
  name: string;
  websiteUrl?: string;
  description?: string;
}

export interface CreateSourceRequest {
  sourceType: SourceType;
  sourceUrl: string;
  active?: boolean;
}

export interface UpdateSourceRequest {
  sourceType: SourceType;
  sourceUrl: string;
  active: boolean;
}
