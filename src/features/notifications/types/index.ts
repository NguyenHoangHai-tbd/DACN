export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'Info' | 'Warning' | 'Alert' | 'Success';
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
  channels: ('Email' | 'Push' | 'InApp')[];
  tenantId?: string;
}

export interface NotificationPreference {
  email: boolean;
  push: boolean;
  inApp: boolean;
  reminderDays: number;
}
