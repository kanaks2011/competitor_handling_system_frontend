import { RiskLevel } from './event.models';

export type AlertFilter = 'ALL' | 'UNREAD' | 'READ' | 'DISMISSED';

export interface AlertSummary {
  id: number;
  competitorEventId: number;
  competitorId: number;
  competitorName: string;
  urgencyLevel: RiskLevel;
  title: string;
  summary: string | null;
  emailSent: boolean;
  emailSentAt: string | null;
  readAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
  unread: boolean;
}

export interface UnreadAlertCount {
  count: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const ALERT_FILTER_OPTIONS: { label: string; value: AlertFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Unread', value: 'UNREAD' },
  { label: 'Read', value: 'READ' },
  { label: 'Dismissed', value: 'DISMISSED' },
];
