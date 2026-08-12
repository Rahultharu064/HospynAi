"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationTemplates = void 0;
exports.getTemplate = getTemplate;
exports.renderTemplate = renderTemplate;
exports.notificationTemplates = {
    // ============================================
    // APPOINTMENT TEMPLATES
    // ============================================
    APPOINTMENT_REMINDER: {
        name: 'Appointment Reminder',
        type: 'APPOINTMENT_REMINDER',
        subject: 'Appointment Reminder - {{appointmentDate}} at {{appointmentTime}}',
        bodyTemplate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1B3A6B, #2563EB); padding: 24px; border-radius: 12px 12px 0 0;">
          <h2 style="color: #fff; margin: 0;">Appointment Reminder</h2>
        </div>
        <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <p>Dear {{patientName}},</p>
          <p>This is a reminder for your upcoming appointment:</p>
          <div style="background: #f0fdfa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Doctor:</strong> {{doctorName}}</p>
            <p><strong>Date:</strong> {{appointmentDate}}</p>
            <p><strong>Time:</strong> {{appointmentTime}}</p>
            <p><strong>Type:</strong> {{appointmentType}}</p>
            <p><strong>Appointment ID:</strong> {{appointmentId}}</p>
          </div>
          <p>Please arrive 10 minutes before your scheduled time.</p>
          {{#if isTelemedicine}}
          <p><strong>Telemedicine Link:</strong> <a href="{{telemedicineUrl}}">Join Session</a></p>
          {{/if}}
          <p style="color: #6b7280; font-size: 14px;">To reschedule or cancel, please contact us at least 24 hours in advance.</p>
        </div>
      </div>
    `,
        smsTemplate: 'VoiceMed Pro: Reminder - Appointment with {{doctorName}} on {{appointmentDate}} at {{appointmentTime}}. ID: {{appointmentId}}. Reply HELP for assistance.',
        pushTemplate: 'Appointment Reminder: {{doctorName}} at {{appointmentTime}} today',
        variables: ['patientName', 'doctorName', 'appointmentDate', 'appointmentTime', 'appointmentType', 'appointmentId', 'isTelemedicine', 'telemedicineUrl'],
        channels: ['EMAIL', 'SMS', 'PUSH'],
    },
    // ============================================
    // APPOINTMENT CONFIRMATION
    // ============================================
    APPOINTMENT_CONFIRMATION: {
        name: 'Appointment Confirmation',
        type: 'APPOINTMENT_CONFIRMATION',
        subject: 'Appointment Confirmed - {{appointmentDate}}',
        bodyTemplate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669, #10B981); padding: 24px; border-radius: 12px 12px 0 0;">
          <h2 style="color: #fff; margin: 0;">✅ Appointment Confirmed</h2>
        </div>
        <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <p>Dear {{patientName}},</p>
          <p>Your appointment has been confirmed:</p>
          <div style="background: #f0fdfa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Doctor:</strong> {{doctorName}}</p>
            <p><strong>Date:</strong> {{appointmentDate}}</p>
            <p><strong>Time:</strong> {{appointmentTime}}</p>
            <p><strong>Appointment ID:</strong> {{appointmentId}}</p>
          </div>
          <p>We look forward to seeing you!</p>
        </div>
      </div>
    `,
        smsTemplate: 'VoiceMed Pro: Appointment confirmed with {{doctorName}} on {{appointmentDate}} at {{appointmentTime}}. ID: {{appointmentId}}',
        pushTemplate: 'Appointment Confirmed: {{doctorName}} on {{appointmentDate}}',
        variables: ['patientName', 'doctorName', 'appointmentDate', 'appointmentTime', 'appointmentId'],
        channels: ['EMAIL', 'SMS', 'PUSH'],
    },
    // ============================================
    // PAYMENT RECEIVED
    // ============================================
    PAYMENT_RECEIVED: {
        name: 'Payment Received',
        type: 'PAYMENT_RECEIVED',
        subject: 'Payment Received - Invoice {{invoiceId}}',
        bodyTemplate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669, #10B981); padding: 24px; border-radius: 12px 12px 0 0;">
          <h2 style="color: #fff; margin: 0;">💳 Payment Received</h2>
        </div>
        <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <p>Dear {{patientName}},</p>
          <p>We have received your payment:</p>
          <div style="background: #f0fdfa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Invoice ID:</strong> {{invoiceId}}</p>
            <p><strong>Amount:</strong> {{currency}} {{amount}}</p>
            <p><strong>Date:</strong> {{paymentDate}}</p>
            <p><strong>Method:</strong> {{paymentMethod}}</p>
          </div>
          <p>Thank you for your payment!</p>
        </div>
      </div>
    `,
        smsTemplate: 'VoiceMed Pro: Payment received - {{currency}} {{amount}} for invoice {{invoiceId}}. Thank you!',
        pushTemplate: 'Payment Received: {{currency}} {{amount}}',
        variables: ['patientName', 'invoiceId', 'currency', 'amount', 'paymentDate', 'paymentMethod'],
        channels: ['EMAIL', 'SMS', 'PUSH'],
    },
    // ============================================
    // LAB RESULTS READY
    // ============================================
    LAB_RESULTS_READY: {
        name: 'Lab Results Ready',
        type: 'LAB_RESULTS_READY',
        subject: 'Your Lab Results Are Ready - {{testName}}',
        bodyTemplate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1B3A6B, #2563EB); padding: 24px; border-radius: 12px 12px 0 0;">
          <h2 style="color: #fff; margin: 0;">🔬 Lab Results Ready</h2>
        </div>
        <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <p>Dear {{patientName}},</p>
          <p>Your lab results are now available:</p>
          <div style="background: #f0fdfa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Test:</strong> {{testName}}</p>
            <p><strong>Date:</strong> {{testDate}}</p>
            <p><strong>Status:</strong> {{testStatus}}</p>
          </div>
          <p>Please log in to your account to view the complete results.</p>
          {{#if requiresFollowUp}}
          <p style="color: #D97706;"><strong>Note:</strong> Your doctor has requested a follow-up appointment to discuss these results.</p>
          {{/if}}
        </div>
      </div>
    `,
        smsTemplate: 'VoiceMed Pro: Your lab results for {{testName}} are ready. Log in to view. {{#if requiresFollowUp}}Follow-up required.{{/if}}',
        pushTemplate: 'Lab Results Ready: {{testName}}',
        variables: ['patientName', 'testName', 'testDate', 'testStatus', 'requiresFollowUp'],
        channels: ['EMAIL', 'SMS', 'PUSH'],
    },
    // ============================================
    // WELCOME
    // ============================================
    WELCOME: {
        name: 'Welcome',
        type: 'WELCOME',
        subject: 'Welcome to VoiceMed Pro! 🎉',
        bodyTemplate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0D9488, #14B8A6); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fff; margin: 0;">Welcome to VoiceMed Pro! 🎉</h1>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <p>Dear {{firstName}},</p>
          <p>Welcome to VoiceMed Pro! We're thrilled to have you join our healthcare platform.</p>
          <div style="background: #f0fdfa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="color: #0D9488;">🌟 What You Can Do:</h3>
            <ul>
              <li>Book appointments online</li>
              <li>Access your medical records</li>
              <li>Connect with doctors via telemedicine</li>
              <li>Get AI-powered health assistance</li>
            </ul>
          </div>
          <p>Get started by completing your profile and booking your first appointment.</p>
        </div>
      </div>
    `,
        smsTemplate: 'Welcome to VoiceMed Pro, {{firstName}}! Your healthcare journey starts here. Download our app to get started.',
        pushTemplate: 'Welcome to VoiceMed Pro, {{firstName}}! 🎉',
        variables: ['firstName', 'lastName', 'email'],
        channels: ['EMAIL', 'SMS', 'PUSH'],
    },
    // ============================================
    // SECURITY ALERT
    // ============================================
    SECURITY_ALERT: {
        name: 'Security Alert',
        type: 'SECURITY_ALERT',
        subject: '⚠️ Security Alert - VoiceMed Pro',
        bodyTemplate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #DC2626; padding: 24px; border-radius: 12px 12px 0 0;">
          <h2 style="color: #fff; margin: 0;">⚠️ Security Alert</h2>
        </div>
        <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <p>Dear {{firstName}},</p>
          <p>We detected {{alertType}} on your account:</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Time:</strong> {{alertTime}}</p>
            <p><strong>Location:</strong> {{alertLocation}}</p>
            <p><strong>IP Address:</strong> {{alertIp}}</p>
          </div>
          <p style="color: #DC2626;"><strong>If this wasn't you, please change your password immediately and contact support.</strong></p>
        </div>
      </div>
    `,
        smsTemplate: 'VoiceMed Pro SECURITY ALERT: {{alertType}} detected at {{alertTime}}. If this wasn\'t you, change your password now.',
        pushTemplate: '⚠️ Security Alert: {{alertType}} detected',
        variables: ['firstName', 'alertType', 'alertTime', 'alertLocation', 'alertIp'],
        channels: ['EMAIL', 'SMS', 'PUSH'],
    },
};
/**
 * Get template by type
 */
function getTemplate(type) {
    return exports.notificationTemplates[type];
}
/**
 * Render template with variables
 */
function renderTemplate(template, data, channel) {
    let templateStr = '';
    switch (channel) {
        case 'EMAIL':
            templateStr = template.bodyTemplate;
            break;
        case 'SMS':
            templateStr = template.smsTemplate;
            break;
        case 'PUSH':
            templateStr = template.pushTemplate;
            break;
        default:
            templateStr = template.bodyTemplate;
    }
    // Replace {{variable}} with actual values
    let result = templateStr;
    for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        result = result.replace(regex, String(value || ''));
    }
    // Handle conditional blocks {{#if variable}}...{{/if}}
    result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, variable, content) => {
        return data[variable] ? content : '';
    });
    return result;
}
//# sourceMappingURL=notificationTemplates.js.map