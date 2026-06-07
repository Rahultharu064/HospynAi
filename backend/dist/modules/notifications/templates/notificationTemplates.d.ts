import { NotificationType, NotificationChannel } from '../../../types/notificationTypes';
export interface TemplateDefinition {
    name: string;
    type: NotificationType;
    subject: string;
    bodyTemplate: string;
    smsTemplate: string;
    pushTemplate: string;
    variables: string[];
    channels: NotificationChannel[];
}
export declare const notificationTemplates: Record<string, TemplateDefinition>;
/**
 * Get template by type
 */
export declare function getTemplate(type: NotificationType): TemplateDefinition | undefined;
/**
 * Render template with variables
 */
export declare function renderTemplate(template: TemplateDefinition, data: Record<string, any>, channel: NotificationChannel): string;
//# sourceMappingURL=notificationTemplates.d.ts.map