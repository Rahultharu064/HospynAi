import { Prisma, NotificationChannel, NotificationStatus } from '@prisma/client';
import prisma from '../../../config/prisma';
import { EmailService } from '../../auth/services/emailService';
import { SmsService } from '../../auth/services/smsService';
import { AuditService } from '../../auth/services/auditService';
import { sendRealTimeNotification } from '../../../utils/socket/notificationSocket';
import { getTemplate, renderTemplate } from '../templates/notificationTemplates';
import {
  CreateNotificationInput,
  BulkNotificationInput,
  NotificationQueryInput,
} from '../validators/notificationValidator';
import {
  BadRequestError,
  NotFoundError,
} from '../../../utils/errors';
import {
  NotificationResponse,
  NotificationListResponse,
  NotificationStats,
  NotificationType,
} from '../../../types/notificationTypes';
import logger from '../../../utils/logger';

export class NotificationService {
  /**
   * Create and send notification
   */
  static async createNotification(
    data: CreateNotificationInput,
    userId: string
  ): Promise<NotificationResponse> {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true, email: true, phone: true, firstName: true, lastName: true },
    });

    if (!user) throw new NotFoundError('User not found');

    // Render template if provided
    let title = data.title;
    let message = data.message;
    const templateData = data.templateData || {};

    if (data.templateId) {
      const template = getTemplate(data.type as NotificationType);
      if (template) {
        title = template.subject;
        message = renderTemplate(template, {
          ...templateData,
          firstName: user.firstName,
          lastName: user.lastName,
        }, data.channel || NotificationChannel.EMAIL);
      }
    }

    // Calculate TTL
    const ttl = data.ttl || 604800; // Default 7 days
    const expiresAt = new Date(Date.now() + ttl * 1000);

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title,
        message,
        type: data.type,
        channel: data.channel || NotificationChannel.EMAIL,
        status: NotificationStatus.PENDING,
        templateId: data.templateId || null,
        metadata: {
          ...data.metadata,
          templateData,
          priority: data.priority || 'normal',
          scheduledFor: data.scheduledFor,
        },
        sentAt: data.sendImmediately ? new Date() : null,
      },
    });

    // Send immediately if requested
    if (data.sendImmediately) {
      await this.sendViaChannel(notification.id, user, data.channel || NotificationChannel.EMAIL);
    }

    // Send real-time notification via WebSocket
    await sendRealTimeNotification(data.userId, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.metadata,
    });

    logger.info(`Notification created: ${notification.id}`);
    return this.formatNotificationResponse(notification);
  }

  /**
   * Send via specific channel
   */
  private static async sendViaChannel(
    notificationId: string,
    user: { id: string; email: string; phone: string | null; firstName: string },
    channel: NotificationChannel
  ): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) return;

    try {
      let sent = false;

      switch (channel) {
        case NotificationChannel.EMAIL:
          sent = await EmailService.sendMail(
            user.email,
            notification.title,
            notification.message
          );
          break;

        case NotificationChannel.SMS:
          if (user.phone) {
            sent = await SmsService.sendSms(
              user.phone,
              `[VoiceMed Pro] ${notification.title}: ${notification.message.substring(0, 150)}`
            );
          }
          break;

        case NotificationChannel.PUSH:
          sent = true; // Handled by WebSocket
          break;
      }

      if (sent) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          },
        });
      }
    } catch (error: any) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.FAILED,
          errorMessage: error.message,
        },
      });
    }
  }

  /**
   * Send appointment reminders
   */
  static async sendAppointmentReminders(): Promise<{ sent: number; failed: number }> {
    const now = new Date();
    const reminderWindows = [24, 2, 1]; // hours before

    let sent = 0;
    let failed = 0;

    for (const hoursBefore of reminderWindows) {
      const targetStart = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000);
      const targetEnd = new Date(targetStart.getTime() + 30 * 60 * 1000);

      const appointments = await prisma.appointment.findMany({
        where: {
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          appointmentDate: { gte: targetStart, lt: targetEnd },
        },
        include: {
          patient: { select: { id: true, email: true, phone: true, firstName: true } },
          doctor: { select: { firstName: true, lastName: true } },
        },
      });

      for (const apt of appointments) {
        try {
          const templateData = {
            patientName: apt.patient.firstName,
            doctorName: `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`,
            appointmentDate: apt.appointmentDate.toLocaleDateString(),
            appointmentTime: apt.startTime,
            appointmentType: apt.type,
            appointmentId: apt.appointmentId,
            isTelemedicine: apt.type === 'TELEMEDICINE',
            telemedicineUrl: '',
          };

          await this.createNotification(
            {
              userId: apt.patient.id,
              title: '',
              message: '',
              type: 'APPOINTMENT_REMINDER',
              channel: NotificationChannel.EMAIL,
              templateId: 'APPOINTMENT_REMINDER',
              templateData,
              sendImmediately: true,
            },
            'system'
          );

          if (apt.patient.phone && hoursBefore <= 2) {
            await this.createNotification(
              {
                userId: apt.patient.id,
                title: '',
                message: '',
                type: 'APPOINTMENT_REMINDER',
                channel: NotificationChannel.SMS,
                templateId: 'APPOINTMENT_REMINDER',
                templateData,
                sendImmediately: true,
              },
              'system'
            );
          }

          sent++;
        } catch (error) {
          failed++;
          logger.error(`Failed to send reminder for appointment ${apt.id}:`, error);
        }
      }
    }

    return { sent, failed };
  }

  /**
   * Send bulk notifications to multiple users
   */
  static async sendBulkNotifications(
    dto: BulkNotificationInput,
    performedBy: string
  ): Promise<{ total: number; sent: number; failed: number }> {
    const { userIds, title, message, type, channel, metadata } = dto;
    const total = userIds.length;
    let sent = 0;
    let failed = 0;

    for (const uid of userIds) {
      try {
        // Use createNotification to persist and optionally send immediately
        await this.createNotification(
          {
            userId: uid,
            title,
            message,
            type,
            channel,
            metadata,
            sendImmediately: true,
          },
          performedBy || 'system'
        );
        sent++;
      } catch (error: any) {
        failed++;
        logger.error(`Failed to send bulk notification to ${uid}: ${error?.message || error}`);
      }
    }

    return { total, sent, failed };
  }

  /**
   * List notifications
   */
  static async listNotifications(
    query: NotificationQueryInput,
    currentUserId?: string
  ): Promise<NotificationListResponse> {
    const { page = 1, limit = 20 } = query;

    const where: Prisma.NotificationWhereInput = {};
    if (currentUserId) where.userId = currentUserId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status as NotificationStatus;
    if (query.isRead !== undefined) {
      where.readAt = query.isRead ? { not: null } : null;
    }

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, readAt: null } }),
    ]);

    return {
      notifications: notifications.map((n) => this.formatNotificationResponse(n)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      unreadCount,
    };
  }

  /**
   * Mark as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<NotificationResponse> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new NotFoundError('Notification not found');

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });

    return this.formatNotificationResponse(updated);
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });

    return { count: result.count };
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new NotFoundError('Notification not found');

    await prisma.notification.delete({ where: { id: notificationId } });
  }

  /**
   * Notification statistics
   */
  static async getNotificationStats(): Promise<NotificationStats> {
    const [totalSent, totalDelivered, totalRead, totalFailed] = await Promise.all([
      prisma.notification.count({ where: { status: 'SENT' } }),
      prisma.notification.count({ where: { status: 'DELIVERED' } }),
      prisma.notification.count({ where: { status: 'READ' } }),
      prisma.notification.count({ where: { status: 'FAILED' } }),
    ]);

    const total = totalSent + totalDelivered + totalRead;

    return {
      totalSent,
      totalDelivered,
      totalRead,
      totalFailed,
      byChannel: {},
      byType: {},
      byStatus: {},
      deliveryRate: total > 0 ? ((totalDelivered + totalRead) / total) * 100 : 0,
      readRate: total > 0 ? (totalRead / total) * 100 : 0,
      averageDeliveryTime: 2.5,
      dailyStats: [],
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private static formatNotificationResponse(notification: any): NotificationResponse {
    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      channel: notification.channel,
      status: notification.status,
      priority: notification.metadata?.priority || 'normal',
      templateId: notification.templateId,
      metadata: notification.metadata,
      scheduledFor: notification.metadata?.scheduledFor || null,
      sentAt: notification.sentAt?.toISOString() || null,
      deliveredAt: notification.deliveredAt?.toISOString() || null,
      readAt: notification.readAt?.toISOString() || null,
      errorMessage: notification.errorMessage,
      ttl: null,
      expiresAt: null,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
