import { SourceType } from './competitor.models';

export type ChangeStatus = 'FIRST_SNAPSHOT' | 'NO_CHANGE' | 'TRIVIAL' | 'SIGNIFICANT';
export type SignificanceLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
export type AnalysisStatus = 'PENDING' | 'DONE' | 'FAILED';

export interface DetectedChangeSummary {
  id: number;
  sourceType: SourceType;
  sourceUrl: string;
  changeStatus: ChangeStatus;
  significanceLevel: SignificanceLevel;
  significanceScore: number;
  significant: boolean;
  linesAdded: number;
  linesRemoved: number;
  summary: string | null;
  detectedAt: string;
  eventId: number | null;
  analysisStatus: AnalysisStatus | null;
}

export interface DetectedChangeDetail extends DetectedChangeSummary {
  competitorId: number;
  competitorSourceId: number;
  currentSnapshotId: number;
  previousSnapshotId: number | null;
  diffUnified: string | null;
  diffHtml: string | null;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ChangeFilters {
  sourceType?: SourceType | null;
  fromDate?: string | null;
  toDate?: string | null;
  significantOnly?: boolean;
  includeNoChange?: boolean;
}
