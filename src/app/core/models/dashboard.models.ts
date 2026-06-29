import { SourceType } from './competitor.models';
import { ChangeStatus } from './change.models';
import { AnalysisStatus, CompetitorEventSummary, RiskLevel } from './event.models';

export interface DashboardSummary {
  totalCompetitors: number;
  activeCompetitors: number;
  eventsThisWeek: number;
  unreadAlerts: number;
}

export interface EventFeedItem extends CompetitorEventSummary {
  competitorName: string;
}

export type HealthStatus = 'CRITICAL' | 'WATCH' | 'STABLE' | 'INACTIVE';

export interface CompetitorHealth {
  competitorId: number;
  competitorName: string;
  active: boolean;
  totalSources: number;
  activeSources: number;
  eventsThisWeek: number;
  significantChangesThisWeek: number;
  highestUrgencyThisWeek: RiskLevel | null;
  lastEventAt: string | null;
  lastChangeAt: string | null;
  healthStatus: HealthStatus;
}

export interface SourceActivityBreakdown {
  sourceId: number;
  sourceType: SourceType;
  sourceUrl: string;
  active: boolean;
  totalChanges: number;
  significantChanges: number;
  lastChangeAt: string | null;
}

export interface TimelineItem {
  changeId: number;
  eventId: number | null;
  sourceType: SourceType;
  sourceUrl: string;
  changeStatus: ChangeStatus;
  summary: string | null;
  urgencyLevel: RiskLevel | null;
  detectedAt: string;
}

export interface CompetitorIntelligence {
  recentEvents: CompetitorEventSummary[];
  sourceBreakdown: SourceActivityBreakdown[];
  timeline: TimelineItem[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const URGENCY_FILTER_OPTIONS: { label: string; value: RiskLevel | null }[] = [
  { label: 'All urgency levels', value: null },
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
];

export const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  CRITICAL: 'Critical',
  WATCH: 'Watch',
  STABLE: 'Stable',
  INACTIVE: 'Inactive',
};
