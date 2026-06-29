export type ScheduleFrequency = 'DAILY' | 'EVERY_2_DAYS' | 'WEEKLY';
export type CrawlLogStatus = 'RUNNING' | 'DONE' | 'FAILED' | 'SKIPPED';
export type CrawlTriggerType = 'SCHEDULED' | 'MANUAL';

export interface ScheduleConfig {
  id: number;
  enabled: boolean;
  frequency: ScheduleFrequency;
  runHour: number;
  runMinute: number;
  dayOfWeek: number | null;
  timezone: string;
  lastRunAt: string | null;
  updatedAt: string;
  cronDescription: string;
  nextFireAt: string | null;
  triggerRegistered: boolean;
}

export interface UpdateScheduleConfigRequest {
  enabled: boolean;
  frequency: ScheduleFrequency;
  runHour: number;
  runMinute: number;
  dayOfWeek: number | null;
  timezone: string;
}

export interface CrawlLog {
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

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
