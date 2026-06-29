import { SourceType } from './competitor.models';
import { ChangeStatus } from './change.models';

export type AnalysisStatus = 'PENDING' | 'DONE' | 'FAILED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface GeneratedResponse {
  id: number;
  competitorEventId: number;
  status: AnalysisStatus;
  counterPositioning: string | null;
  battlecardUpdate: string | null;
  campaignIdea: string | null;
  socialPostIdea: string | null;
  emailAngle: string | null;
  objectionHandlingNote: string | null;
  errorMessage: string | null;
  generatedAt: string | null;
}

export interface ResponseField {
  key: keyof Pick<
    GeneratedResponse,
    | 'counterPositioning'
    | 'battlecardUpdate'
    | 'campaignIdea'
    | 'socialPostIdea'
    | 'emailAngle'
    | 'objectionHandlingNote'
  >;
  label: string;
  icon: string;
}

export const RESPONSE_FIELDS: ResponseField[] = [
  { key: 'counterPositioning', label: 'Counter positioning', icon: 'pi-shield' },
  { key: 'battlecardUpdate', label: 'Battlecard update', icon: 'pi-book' },
  { key: 'campaignIdea', label: 'Campaign idea', icon: 'pi-megaphone' },
  { key: 'socialPostIdea', label: 'Social post idea', icon: 'pi-share-alt' },
  { key: 'emailAngle', label: 'Email angle', icon: 'pi-envelope' },
  { key: 'objectionHandlingNote', label: 'Objection handling', icon: 'pi-comments' },
];

export interface CompetitorEventSummary {
  id: number;
  detectedChangeId: number;
  competitorId: number;
  sourceType: SourceType;
  sourceUrl: string;
  analysisStatus: AnalysisStatus;
  changeType: string | null;
  mainMessage: string | null;
  salesRisk: RiskLevel | null;
  urgencyLevel: RiskLevel | null;
  analyzedAt: string | null;
  createdAt: string;
}

export interface CompetitorEventDetail {
  id: number;
  detectedChangeId: number;
  competitorId: number;
  competitorName: string;
  competitorSourceId: number;
  sourceType: SourceType;
  sourceUrl: string;
  analysisStatus: AnalysisStatus;
  changeType: string | null;
  mainMessage: string | null;
  targetAudience: string | null;
  offer: string | null;
  cta: string | null;
  positioningAngle: string | null;
  salesRisk: RiskLevel | null;
  urgencyLevel: RiskLevel | null;
  changeStatus: ChangeStatus;
  changeSummary: string | null;
  diffUnified: string | null;
  errorMessage: string | null;
  detectedAt: string;
  analyzedAt: string | null;
  createdAt: string;
  generatedResponse: GeneratedResponse | null;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
