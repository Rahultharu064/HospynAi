window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};

window.__APP_CONFIG__.apiUrl = window.__APP_CONFIG__.apiUrl || 'http://localhost:5000/api/v1';
window.__APP_CONFIG__.socketUrl = window.__APP_CONFIG__.socketUrl || 'http://localhost:5000';
window.__APP_CONFIG__.googleAuthUrl = window.__APP_CONFIG__.googleAuthUrl || 'http://localhost:5000/api/v1/auth/google';
window.__APP_CONFIG__.appName = window.__APP_CONFIG__.appName || 'HospynAI';
window.__APP_CONFIG__.appVersion = window.__APP_CONFIG__.appVersion || '1.0.0';
window.__APP_CONFIG__.features = window.__APP_CONFIG__.features || {};
window.__APP_CONFIG__.features.blockchain = window.__APP_CONFIG__.features.blockchain ?? true;
window.__APP_CONFIG__.features.aiChat = window.__APP_CONFIG__.features.aiChat ?? true;
window.__APP_CONFIG__.features.voiceAgent = window.__APP_CONFIG__.features.voiceAgent ?? true;
