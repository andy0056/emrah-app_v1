/**
 * Unified Secure Service Layer
 *
 * Integrates all security services to provide comprehensive protection
 * for AI applications against prompt injection, data leaks, and auth attacks
 */

import { PromptSecurityService, type SecurityViolation } from './promptSecurity';
import { DataPrivacyService, type PIIDetection, type DataExposureEvent } from './dataPrivacy';
import { AuthSecurityService, type SecurityEvent as AuthEvent } from './authSecurity';
import { SecurityMonitoringService, type SecurityIncident } from './securityMonitoring';

interface SecureRequestConfig {
  endpoint: string;
  clientId: string;
  requireAuth: boolean;
  enablePIIDetection: boolean;
  enablePromptValidation: boolean;
  enableOutputSanitization: boolean;
  enableMonitoring: boolean;
}

interface SecureResponse<T = any> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
  securityEvents: SecurityEventSummary[];
  metadata: {
    requestId: string;
    processingTime: number;
    securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    sanitizationApplied: boolean;
  };
}

interface SecurityEventSummary {
  type: 'PROMPT_INJECTION' | 'PII_DETECTED' | 'AUTH_FAILURE' | 'RATE_LIMIT' | 'MONITORING_ALERT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  action: 'LOGGED' | 'BLOCKED' | 'SANITIZED' | 'CONTAINED';
  message: string;
}

class SecureService {
  /**
   * Main secure request handler
   */
  static async processSecureRequest<T>(
    input: string,
    config: SecureRequestConfig,
    processor: (sanitizedInput: string) => Promise<T>
  ): Promise<SecureResponse<T>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const errors: string[] = [];
    const warnings: string[] = [];
    const securityEvents: SecurityEventSummary[] = [];

    try {
      // 1. AUTHENTICATION & AUTHORIZATION
      if (config.requireAuth) {
        const authResult = await this.validateAuthentication(config.clientId, config.endpoint);
        if (!authResult.isValid) {
          this.reportAuthFailure(config.clientId, authResult.events);
          return this.createErrorResponse(requestId, startTime, ['Authentication failed'], securityEvents);
        }
        securityEvents.push(...authResult.events);
      }

      // 2. RATE LIMITING
      const rateLimitResult = AuthSecurityService.checkRateLimit(config.clientId, config.endpoint);
      if (!rateLimitResult.allowed) {
        securityEvents.push({
          type: 'RATE_LIMIT',
          severity: 'MEDIUM',
          action: 'BLOCKED',
          message: 'Rate limit exceeded'
        });

        SecurityMonitoringService.reportIncident(
          'AUTH_ATTACK',
          'MEDIUM',
          'Rate limit exceeded',
          config.clientId,
          [],
          { endpoint: config.endpoint }
        );

        return this.createErrorResponse(requestId, startTime, ['Rate limit exceeded'], securityEvents);
      }

      // 3. PROMPT SECURITY VALIDATION
      let sanitizedInput = input;
      if (config.enablePromptValidation) {
        const promptResult = PromptSecurityService.validatePrompt(input, config.endpoint);

        if (!promptResult.isValid) {
          // Critical prompt injection detected
          securityEvents.push({
            type: 'PROMPT_INJECTION',
            severity: 'CRITICAL',
            action: 'BLOCKED',
            message: 'Prompt injection attempt blocked'
          });

          SecurityMonitoringService.reportIncident(
            'PROMPT_INJECTION',
            'CRITICAL',
            'Prompt injection detected and blocked',
            config.clientId,
            [{ type: 'USER_INPUT', data: input.substring(0, 200), source: config.endpoint }],
            { violations: promptResult.violations }
          );

          return this.createErrorResponse(requestId, startTime, ['Security violation detected'], securityEvents);
        }

        // Log any security violations
        for (const violation of promptResult.violations) {
          securityEvents.push({
            type: 'PROMPT_INJECTION',
            severity: violation.severity,
            action: violation.blocked ? 'BLOCKED' : 'LOGGED',
            message: violation.description
          });

          if (violation.severity === 'HIGH' || violation.severity === 'CRITICAL') {
            warnings.push(`Security concern: ${violation.description}`);
          }
        }

        sanitizedInput = promptResult.sanitizedInput || input;
      }

      // 4. PII DETECTION & SANITIZATION
      if (config.enablePIIDetection) {
        const piiResult = DataPrivacyService.validateInput(sanitizedInput, config.endpoint);

        for (const violation of piiResult.violations) {
          securityEvents.push({
            type: 'PII_DETECTED',
            severity: violation.severity,
            action: 'SANITIZED',
            message: violation.details
          });

          if (violation.severity === 'HIGH' || violation.severity === 'CRITICAL') {
            warnings.push(`Data privacy concern: ${violation.details}`);
          }
        }

        sanitizedInput = piiResult.sanitizedInput;
      }

      // 5. PROCESS REQUEST WITH SANITIZED INPUT
      console.log(`🔒 Processing secure request ${requestId}`, {
        endpoint: config.endpoint,
        clientId: config.clientId,
        inputLength: input.length,
        sanitizedLength: sanitizedInput.length,
        securityEvents: securityEvents.length
      });

      const result = await processor(sanitizedInput);

      // 6. OUTPUT SANITIZATION
      let finalResult = result;
      if (config.enableOutputSanitization && typeof result === 'string') {
        const outputResult = DataPrivacyService.sanitizeOutput(result, sanitizedInput);

        for (const violation of outputResult.violations) {
          securityEvents.push({
            type: 'PII_DETECTED',
            severity: violation.severity,
            action: 'SANITIZED',
            message: 'PII detected and sanitized in output'
          });

          if (violation.severity === 'CRITICAL') {
            SecurityMonitoringService.reportIncident(
              'DATA_BREACH',
              'CRITICAL',
              'PII detected in AI model output',
              config.clientId,
              [
                { type: 'USER_INPUT', data: sanitizedInput.substring(0, 200), source: config.endpoint },
                { type: 'SYSTEM_OUTPUT', data: String(result).substring(0, 200), source: 'AI_MODEL' }
              ]
            );
          }
        }

        finalResult = outputResult.sanitizedOutput as T;
      }

      // 7. BEHAVIORAL ANALYSIS & MONITORING
      if (config.enableMonitoring) {
        await this.performBehavioralAnalysis(config.clientId, {
          endpoint: config.endpoint,
          inputLength: input.length,
          processingTime: Date.now() - startTime,
          securityEvents: securityEvents.length
        });
      }

      const processingTime = Date.now() - startTime;
      const securityLevel = this.calculateSecurityLevel(securityEvents);

      return {
        success: true,
        data: finalResult,
        errors,
        warnings,
        securityEvents,
        metadata: {
          requestId,
          processingTime,
          securityLevel,
          sanitizationApplied: sanitizedInput !== input || (typeof result === 'string' && finalResult !== result)
        }
      };

    } catch (error) {
      console.error(`🚨 Secure request processing failed for ${requestId}:`, error);

      // Report system failure
      SecurityMonitoringService.reportIncident(
        'SYSTEM_COMPROMISE',
        'HIGH',
        'Secure request processing failure',
        config.clientId,
        [{ type: 'LOG_ENTRY', data: String(error), source: 'SECURE_SERVICE' }],
        { requestId, endpoint: config.endpoint }
      );

      return this.createErrorResponse(
        requestId,
        startTime,
        ['Internal security error'],
        securityEvents
      );
    }
  }

  /**
   * Validate authentication for secure requests
   */
  private static async validateAuthentication(clientId: string, endpoint: string): Promise<{
    isValid: boolean;
    events: SecurityEventSummary[];
  }> {
    const events: SecurityEventSummary[] = [];

    // Check for client lockout due to failed attempts
    const lockoutResult = AuthSecurityService.trackFailedAuth(clientId);
    if (lockoutResult.locked) {
      events.push({
        type: 'AUTH_FAILURE',
        severity: 'HIGH',
        action: 'BLOCKED',
        message: 'Client temporarily locked due to failed attempts'
      });
      return { isValid: false, events };
    }

    // In a real application, validate API key here
    // For demo purposes, assume validation passes
    return { isValid: true, events };
  }

  /**
   * Report authentication failures for monitoring
   */
  private static reportAuthFailure(clientId: string, events: SecurityEventSummary[]): void {
    SecurityMonitoringService.reportIncident(
      'AUTH_ATTACK',
      'HIGH',
      'Authentication failure detected',
      clientId,
      [],
      { events }
    );
  }

  /**
   * Perform behavioral analysis for anomaly detection
   */
  private static async performBehavioralAnalysis(clientId: string, metadata: {
    endpoint: string;
    inputLength: number;
    processingTime: number;
    securityEvents: number;
  }): Promise<void> {
    // Simple behavioral analysis - in production, use ML models
    const suspiciousPatterns = [
      metadata.inputLength > 5000, // Very long inputs
      metadata.processingTime > 30000, // Long processing times
      metadata.securityEvents > 3 // Multiple security events
    ];

    const suspiciousCount = suspiciousPatterns.filter(Boolean).length;

    if (suspiciousCount >= 2) {
      SecurityMonitoringService.reportIncident(
        'MODEL_ABUSE',
        'MEDIUM',
        'Suspicious behavioral patterns detected',
        clientId,
        [],
        { patterns: suspiciousPatterns, metadata }
      );
    }
  }

  /**
   * Calculate overall security level for request
   */
  private static calculateSecurityLevel(events: SecurityEventSummary[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalEvents = events.filter(e => e.severity === 'CRITICAL').length;
    const highEvents = events.filter(e => e.severity === 'HIGH').length;

    if (criticalEvents > 0) return 'CRITICAL';
    if (highEvents > 1) return 'HIGH';
    if (events.length > 3) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Create error response
   */
  private static createErrorResponse(
    requestId: string,
    startTime: number,
    errors: string[],
    securityEvents: SecurityEventSummary[]
  ): SecureResponse {
    return {
      success: false,
      errors,
      warnings: [],
      securityEvents,
      metadata: {
        requestId,
        processingTime: Date.now() - startTime,
        securityLevel: 'CRITICAL',
        sanitizationApplied: false
      }
    };
  }

  /**
   * Generate unique request ID
   */
  private static generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `REQ_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Security health check
   */
  static getSecurityHealth(): {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    checks: Record<string, boolean>;
    recommendations: string[];
  } {
    const checks = {
      promptSecurity: true, // PromptSecurityService is active
      dataPrivacy: true, // DataPrivacyService is active
      authSecurity: true, // AuthSecurityService is active
      monitoring: true, // SecurityMonitoringService is active
      rateLimit: AuthSecurityService.getConfig().enableRateLimit,
      piiDetection: DataPrivacyService.getConfig().enablePIIDetection
    };

    const failedChecks = Object.values(checks).filter(check => !check).length;
    const status = failedChecks === 0 ? 'HEALTHY' : failedChecks < 3 ? 'WARNING' : 'CRITICAL';

    const recommendations: string[] = [];
    if (!checks.rateLimit) recommendations.push('Enable rate limiting');
    if (!checks.piiDetection) recommendations.push('Enable PII detection');
    if (failedChecks > 0) recommendations.push('Review security configuration');

    return { status, checks, recommendations };
  }
}

export { SecureService, type SecureRequestConfig, type SecureResponse, type SecurityEventSummary };