export interface NotificationRecipient {
  id: number;
  email: string;
  name: string | null;
  alertEnabled: boolean;
  weeklyReportEnabled: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationRecipientRequest {
  email: string;
  name?: string | null;
  alertEnabled?: boolean;
  weeklyReportEnabled?: boolean;
}

export interface UpdateNotificationRecipientRequest {
  name?: string | null;
  alertEnabled?: boolean;
  weeklyReportEnabled?: boolean;
  active?: boolean;
}
