"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../../config/prisma"));
const emailService_1 = require("../../auth/services/emailService");
const smsService_1 = require("../../auth/services/smsService");
const notificationSocket_1 = require("../../../utils/socket/notificationSocket");
const notificationTemplates_1 = require("../templates/notificationTemplates");
const errors_1 = require("../../../utils/errors");
const logger_1 = __importDefault(require("../../../utils/logger"));
class NotificationService {
    /**
     * Create and send notification
     */
    static async createNotification(data, userId) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: data.userId },
            select: { id: true, email: true, phone: true, firstName: true, lastName: true },
        });
        if (!user)
            throw new errors_1.NotFoundError('User not found');
        // Render template if provided
        let title = data.title;
        let message = data.message;
        const templateData = data.templateData || {};
        if (data.templateId) {
            const template = (0, notificationTemplates_1.getTemplate)(data.type);
            if (template) {
                title = template.subject;
                message = (0, notificationTemplates_1.renderTemplate)(template, {
                    ...templateData,
                    firstName: user.firstName,
                    lastName: user.lastName,
                }, data.channel || client_1.NotificationChannel.EMAIL);
            }
        }
        // Calculate TTL
        const ttl = data.ttl || 604800; // Default 7 days
        const expiresAt = new Date(Date.now() + ttl * 1000);
        // Create notification
        const notification = await prisma_1.default.notification.create({
            data: {
                userId: data.userId,
                title,
                message,
                type: data.type,
                channel: data.channel || client_1.NotificationChannel.EMAIL,
                status: client_1.NotificationStatus.PENDING,
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
            await this.sendViaChannel(notification.id, user, data.channel || client_1.NotificationChannel.EMAIL);
        }
        // Send real-time notification via WebSocket
        await (0, notificationSocket_1.sendRealTimeNotification)(data.userId, {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.metadata,
        });
        logger_1.default.info(`Notification created: ${notification.id}`);
        return this.formatNotificationResponse(notification);
    }
    /**
     * Send via specific channel
     */
    static async sendViaChannel(notificationId, user, channel) {
        const notification = await prisma_1.default.notification.findUnique({
            where: { id: notificationId },
        });
        if (!notification)
            return;
        try {
            let sent = false;
            switch (channel) {
                case client_1.NotificationChannel.EMAIL:
                    await emailService_1.EmailService.sendMail(user.email, notification.title, notification.message, { throwOnError: true });
                    sent = true;
                    break;
                case client_1.NotificationChannel.SMS:
                    if (user.phone) {
                        sent = await smsService_1.SmsService.sendSms(user.phone, `[VoiceMed Pro] ${notification.title}: ${notification.message.substring(0, 150)}`);
                    }
                    break;
                case client_1.NotificationChannel.PUSH:
                    sent = true; // Handled by WebSocket
                    break;
            }
            if (sent) {
                await prisma_1.default.notification.update({
                    where: { id: notificationId },
                    data: {
                        status: client_1.NotificationStatus.SENT,
                        sentAt: new Date(),
                    },
                });
            }
        }
        catch (error) {
            await prisma_1.default.notification.update({
                where: { id: notificationId },
                data: {
                    status: client_1.NotificationStatus.FAILED,
                    errorMessage: error.message,
                },
            });
        }
    }
    /**
     * Send appointment reminders
     */
    static async sendAppointmentReminders() {
        const now = new Date();
        const reminderWindows = [24, 2, 1]; // hours before
        let sent = 0;
        let failed = 0;
        for (const hoursBefore of reminderWindows) {
            const targetStart = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000);
            const targetEnd = new Date(targetStart.getTime() + 30 * 60 * 1000);
            const appointments = await prisma_1.default.appointment.findMany({
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
                    await this.createNotification({
                        userId: apt.patient.id,
                        title: '',
                        message: '',
                        type: 'APPOINTMENT_REMINDER',
                        channel: client_1.NotificationChannel.EMAIL,
                        templateId: 'APPOINTMENT_REMINDER',
                        templateData,
                        sendImmediately: true,
                    }, 'system');
                    if (apt.patient.phone && hoursBefore <= 2) {
                        await this.createNotification({
                            userId: apt.patient.id,
                            title: '',
                            message: '',
                            type: 'APPOINTMENT_REMINDER',
                            channel: client_1.NotificationChannel.SMS,
                            templateId: 'APPOINTMENT_REMINDER',
                            templateData,
                            sendImmediately: true,
                        }, 'system');
                    }
                    sent++;
                }
                catch (error) {
                    failed++;
                    logger_1.default.error(`Failed to send reminder for appointment ${apt.id}:`, error);
                }
            }
        }
        return { sent, failed };
    }
    /**
     * Send bulk notifications to multiple users
     */
    static async sendBulkNotifications(dto, performedBy) {
        const { userIds, title, message, type, channel, metadata } = dto;
        const total = userIds.length;
        let sent = 0;
        let failed = 0;
        for (const uid of userIds) {
            try {
                // Use createNotification to persist and optionally send immediately
                await this.createNotification({
                    userId: uid,
                    title,
                    message,
                    type,
                    channel,
                    metadata,
                    sendImmediately: true,
                }, performedBy || 'system');
                sent++;
            }
            catch (error) {
                failed++;
                logger_1.default.error(`Failed to send bulk notification to ${uid}: ${error?.message || error}`);
            }
        }
        return { total, sent, failed };
    }
    /**
     * List notifications
     */
    static async listNotifications(query, currentUserId) {
        const { page = 1, limit = 20 } = query;
        const where = {};
        if (currentUserId)
            where.userId = currentUserId;
        if (query.type)
            where.type = query.type;
        if (query.status)
            where.status = query.status;
        if (query.isRead !== undefined) {
            where.readAt = query.isRead ? { not: null } : null;
        }
        const skip = (page - 1) * limit;
        const [notifications, total, unreadCount] = await Promise.all([
            prisma_1.default.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.default.notification.count({ where }),
            prisma_1.default.notification.count({ where: { ...where, readAt: null } }),
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
    static async markAsRead(notificationId, userId) {
        const notification = await prisma_1.default.notification.findFirst({
            where: { id: notificationId, userId },
        });
        if (!notification)
            throw new errors_1.NotFoundError('Notification not found');
        const updated = await prisma_1.default.notification.update({
            where: { id: notificationId },
            data: { status: client_1.NotificationStatus.READ, readAt: new Date() },
        });
        return this.formatNotificationResponse(updated);
    }
    /**
     * Mark all notifications as read for a user
     */
    static async markAllAsRead(userId) {
        const result = await prisma_1.default.notification.updateMany({
            where: { userId, readAt: null },
            data: { status: client_1.NotificationStatus.READ, readAt: new Date() },
        });
        return { count: result.count };
    }
    /**
     * Delete notification
     */
    static async deleteNotification(notificationId, userId) {
        const notification = await prisma_1.default.notification.findFirst({
            where: { id: notificationId, userId },
        });
        if (!notification)
            throw new errors_1.NotFoundError('Notification not found');
        await prisma_1.default.notification.delete({ where: { id: notificationId } });
    }
    /**
     * Notification statistics
     */
    static async getNotificationStats() {
        const [totalSent, totalDelivered, totalRead, totalFailed] = await Promise.all([
            prisma_1.default.notification.count({ where: { status: 'SENT' } }),
            prisma_1.default.notification.count({ where: { status: 'DELIVERED' } }),
            prisma_1.default.notification.count({ where: { status: 'READ' } }),
            prisma_1.default.notification.count({ where: { status: 'FAILED' } }),
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
    static formatNotificationResponse(notification) {
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
exports.NotificationService = NotificationService;
//# sourceMappingURL=notificationService.js.map