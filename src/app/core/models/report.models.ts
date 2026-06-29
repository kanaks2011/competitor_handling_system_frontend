export type WeeklyReportStatus = 'GENERATED' | 'SENT' | 'FAILED';

export interface WeeklyReportConfig {
  id: number;
  enabled: boolean;
  dayOfWeek: number;
  runHour: number;
  runMinute: number;
  timezone: string;
  updatedAt: string;
  scheduleDescription: string;
  nextFireAt: string | null;
  triggerRegistered: boolean;
}

export interface UpdateWeeklyReportConfigRequest {
  enabled: boolean;
  dayOfWeek: number;
  runHour: number;
  runMinute: number;
  timezone: string;
}

export interface WeeklyReportSummary {
  id: number;
  title: string;
  periodStart: string;
  periodEnd: string;
  eventCount: number;
  highUrgencyCount: number;
  competitorCount: number;
  emailSent: boolean;
  emailSentAt: string | null;
  emailError: string | null;
  status: WeeklyReportStatus;
  createdAt: string;
}

export interface WeeklyReportDetail extends WeeklyReportSummary {
  htmlContent: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
