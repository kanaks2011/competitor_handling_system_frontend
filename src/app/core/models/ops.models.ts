import { CrawlLogStatus, CrawlTriggerType, ScheduleConfig } from './scheduler.models';

export type OpsOverallStatus = 'OK' | 'DEGRADED' | 'ERROR';
export type DependencyStatus = 'OK' | 'WARNING' | 'ERROR' | 'DISABLED';

export interface DependencyInfo {
  name: string;
  status: DependencyStatus;
  message: string;
}

export interface PipelineMetrics {
  significantChangesAwaitingAnalysis: number;
  analysisPending: number;
  analysisFailed: number;
  responsesPending: number;
  responsesFailed: number;
  alertsEmailPending: number;
  alertsEmailFailed: number;
  weeklyReportsEmailFailed: number;
  pipelineHealthy: boolean;
}

export interface CrawlLogSummary {
  id: number;
  triggerType: CrawlTriggerType;
  status: CrawlLogStatus;
  startedAt: string;
  finishedAt: string | null;
  competitorsTotal: number;
  competitorsSuccess: number;
  competitorsFailed: number;
  competitorsSkipped: number;
  errorMessage: string | null;
}

export interface OpsStatus {
  checkedAt: string;
  overallStatus: OpsOverallStatus;
  pipeline: PipelineMetrics;
  dependencies: DependencyInfo[];
  scheduler: ScheduleConfig | null;
  lastCrawl: CrawlLogSummary | null;
}

export interface DependencyProbeResult {
  name: string;
  reachable: boolean;
  message: string;
  durationMs: number;
}

export interface OpsProbeResponse {
  checkedAt: string;
  results: DependencyProbeResult[];
}
