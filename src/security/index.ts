/**
 * Security Services Export Index
 *
 * Centralized exports for all security services
 */

// Core Security Services
export { PromptSecurityService, type SecurityViolation, type SecurityConfig } from './promptSecurity';
export { DataPrivacyService, type PIIDetection, type PrivacyConfig, type DataExposureEvent } from './dataPrivacy';
export { AuthSecurityService, type SecurityEvent, type AuthSecurityConfig, type SecurityHeaders } from './authSecurity';
export { SecurityMonitoringService, type SecurityIncident, type SecurityMetrics, type MonitoringConfig } from './securityMonitoring';

// Unified Security Layer
export { SecureService, type SecureRequestConfig, type SecureResponse, type SecurityEventSummary } from './secureService';

// Security Health Check
export const getSecurityStatus = () => {
  const health = SecureService.getSecurityHealth();
  const prompts = PromptSecurityService.getConfig();
  const privacy = DataPrivacyService.getConfig();
  const auth = AuthSecurityService.getConfig();

  return {
    overall: health,
    services: {
      promptSecurity: {
        enabled: prompts.enableInjectionProtection,
        jailbreakDetection: prompts.enableJailbreakDetection,
        systemLeakPrevention: prompts.enableSystemLeakPrevention
      },
      dataPrivacy: {
        enabled: privacy.enablePIIDetection,
        dataMinimization: privacy.enableDataMinimization,
        outputSanitization: privacy.enableOutputSanitization
      },
      authentication: {
        enabled: auth.enableKeyRotation,
        rateLimit: auth.enableRateLimit,
        requestSigning: auth.enableRequestSigning
      }
    },
    recommendations: health.recommendations
  };
};

// Quick security setup for common use cases
export const configureSecurityForProduction = () => {
  // Enable all security features for production
  PromptSecurityService.updateConfig({
    enableInjectionProtection: true,
    enableJailbreakDetection: true,
    enableSystemLeakPrevention: true,
    enableContentFiltering: true,
    logSecurityEvents: true,
    blockOnViolation: true,
    maxPromptLength: 4000
  });

  DataPrivacyService.updateConfig({
    enablePIIDetection: true,
    enableDataMinimization: true,
    enableOutputSanitization: true,
    enableAuditLogging: true,
    retentionPolicyDays: 30,
    allowDataTraining: false
  });

  AuthSecurityService.updateConfig({
    enableKeyRotation: true,
    enableRateLimit: true,
    enableRequestSigning: true,
    enableSessionValidation: true,
    maxFailedAttempts: 5,
    lockoutDurationMs: 15 * 60 * 1000,
    keyExpiryHours: 24
  });

  console.log('🔒 Security configured for production environment');
};

export const configureSecurityForDevelopment = () => {
  // Relaxed settings for development
  PromptSecurityService.updateConfig({
    enableInjectionProtection: true,
    enableJailbreakDetection: true,
    enableSystemLeakPrevention: true,
    enableContentFiltering: false, // Allow more content in dev
    logSecurityEvents: true,
    blockOnViolation: false, // Log but don't block in dev
    maxPromptLength: 8000 // Allow longer prompts for testing
  });

  DataPrivacyService.updateConfig({
    enablePIIDetection: true,
    enableDataMinimization: false, // Keep full data for debugging
    enableOutputSanitization: true,
    enableAuditLogging: true,
    retentionPolicyDays: 7, // Shorter retention in dev
    allowDataTraining: false
  });

  AuthSecurityService.updateConfig({
    enableKeyRotation: false, // Don't rotate keys in dev
    enableRateLimit: true,
    enableRequestSigning: false, // Simplified auth in dev
    enableSessionValidation: false,
    maxFailedAttempts: 10, // More lenient in dev
    lockoutDurationMs: 5 * 60 * 1000, // Shorter lockout
    keyExpiryHours: 168 // 1 week expiry
  });

  console.log('🔒 Security configured for development environment');
};