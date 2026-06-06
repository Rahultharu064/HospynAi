import type { NotificationChannel, NotificationStatus } from '@prisma/client';
export type { NotificationChannel, NotificationStatus };

// ============================================
// NOTIFICATION DTOs
// ============================================

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  channel?: NotificationChannel;
  templateId?: string;
  templateData?: Record<string, any>;
  metadata?: Record<string, any>;
  sendImmediately?: boolean;
  scheduledFor?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  ttl?: number; // Time to live in seconds
}

export type NotificationType =
  | 'APPOINTMENT_REMINDER'
  | 'APPOINTMENT_CONFIRMATION'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'PRESCRIPTION_READY'
  | 'LAB_RESULTS_READY'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_DUE'
  | 'PAYMENT_OVERDUE'
  | 'SYSTEM_ALERT'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'WELCOME'
  | 'ACCOUNT_VERIFICATION'
  | 'PASSWORD_RESET'
  | 'SECURITY_ALERT'
  | 'MARKETING'
  | 'FOLLOW_UP'
  | 'CUSTOM';

export interface BulkNotificationDto {
  userIds: string[];
  title: string;
  message: string;
  type: NotificationType;
  channel?: NotificationChannel;
  templateData?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateNotificationDto {
  status?: NotificationStatus;
  readAt?: string;
}

export interface NotificationQueryDto {
  page?: number;
  limit?: number;
  userId?: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  isRead?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationPreferencesDto {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
  voiceCallEnabled?: boolean;
  appointmentReminders?: boolean;
  billingAlerts?: boolean;
  systemAlerts?: boolean;
  marketingEmails?: boolean;
  reminderIntervals?: number[];
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
  language?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  priority: string;
  templateId: string | null;
  metadata: Record<string, any> | null;
  scheduledFor: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  errorMessage: string | null;
  ttl: number | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

export interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  byChannel: Record<string, number>;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  deliveryRate: number;
  readRate: number;
  averageDeliveryTime: number;
  dailyStats: Array<{
    date: string;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  }>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject: string;
  bodyTemplate: string;
  smsTemplate: string;
  pushTemplate: string;
  variables: string[];
  channels: NotificationChannel[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RealTimeNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: any;
  timestamp: string;
}