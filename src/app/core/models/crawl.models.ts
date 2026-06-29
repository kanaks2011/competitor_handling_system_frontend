export type CrawlJobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
export type SnapshotStatus = 'SUCCESS' | 'FAILED';

export interface PageSnapshotSummary {
  id: number;
  competitorSourceId: number;
  sourceType: string;
  sourceUrl: string;
  status: SnapshotStatus;
  errorMessage: string | null;
  contentLength: number;
  scrapedAt: string | null;
}

export interface CrawlJobResponse {
  id: number;
  competitorId: number;
  status: CrawlJobStatus;
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
  sourcesTotal: number;
  sourcesSuccess: number;
  sourcesFailed: number;
  createdAt: string;
  snapshots: PageSnapshotSummary[];
}
