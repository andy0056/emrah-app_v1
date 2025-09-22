/**
 * Data Privacy & Exposure Protection
 *
 * Prevents:
 * - Data leakage in prompts/outputs
 * - Model inversion/extraction attacks
 * - Unintended data retention
 * - PII exposure in logs
 */

interface PrivacyConfig {
  enablePIIDetection: boolean;
  enableDataMinimization: boolean;
  enableOutputSanitization: boolean;
  enableAuditLogging: boolean;
  retentionPolicyDays: number;
  allowDataTraining: boolean;
}

interface PIIDetection {
  type: 'EMAIL' | 'PHONE' | 'SSN' | 'CREDIT_CARD' | 'ADDRESS' | 'NAME' | 'API_KEY' | 'OTHER';
  value: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

interface DataExposureEvent {
  timestamp: string;
  eventType: 'PII_DETECTED' | 'DATA_LEAKED' | 'MODEL_EXTRACTION_ATTEMPT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  data?: {
    inputHash: string;
    outputHash: string;
    piiDetected: PIIDetection[];
  };
}

class DataPrivacyService {
  private static config: PrivacyConfig = {
    enablePIIDetection: true,
    enableDataMinimization: true,
    enableOutputSanitization: true,
    enableAuditLogging: true,
    retentionPolicyDays: 30,
    allowDataTraining: false
  };

  // Enhanced PII detection patterns
  private static readonly PII_PATTERNS = {
    EMAIL: {
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      confidence: 0.95
    },
    PHONE: {
      pattern: /(\+1\s?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\d{3}[\s.-]?\d{3}[\s.-]?\d{4})/g,
      confidence: 0.85
    },
    SSN: {
      pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
      confidence: 0.99
    },
    CREDIT_CARD: {
      pattern: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
      confidence: 0.90
    },
    ADDRESS: {
      pattern: /\b\d+\s+[A-Za-z0-9\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)\b/gi,
      confidence: 0.70
    },
    API_KEY_OPENAI: {
      pattern: /sk-[a-zA-Z0-9]{48}/g,
      confidence: 0.99
    },
    API_KEY_GENERIC: {
      pattern: /(?:api[_-]?key|secret[_-]?key|access[_-]?token)['":\s]*[a-zA-Z0-9_-]{16,}/gi,
      confidence: 0.80
    },
    IPV4: {
      pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
      confidence: 0.85
    }
  };

  // Common first/last names for name detection
  private static readonly COMMON_NAMES = new Set([
    'john', 'jane', 'michael', 'sarah', 'david', 'emily', 'james', 'jennifer',
    'robert', 'linda', 'william', 'elizabeth', 'richard', 'maria', 'joseph',
    'susan', 'thomas', 'jessica', 'christopher', 'karen', 'charles', 'nancy'
  ]);

  /**
   * Comprehensive PII detection in text
   */
  static detectPII(text: string): PIIDetection[] {
    const detections: PIIDetection[] = [];

    // Detect known PII patterns
    for (const [type, config] of Object.entries(this.PII_PATTERNS)) {
      const matches = [...text.matchAll(config.pattern)];
      for (const match of matches) {
        if (match.index !== undefined) {
          detections.push({
            type: type as PIIDetection['type'],
            value: match[0],
            confidence: config.confidence,
            startIndex: match.index,
            endIndex: match.index + match[0].length
          });
        }
      }
    }

    // Detect potential names
    const nameDetections = this.detectNames(text);
    detections.push(...nameDetections);

    return detections.sort((a, b) => a.startIndex - b.startIndex);
  }

  /**
   * Detect potential names in text
   */
  private static detectNames(text: string): PIIDetection[] {
    const detections: PIIDetection[] = [];
    const words = text.split(/\s+/);

    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase().replace(/[^a-z]/g, '');
      if (this.COMMON_NAMES.has(word) && word.length > 2) {
        const startIndex = text.toLowerCase().indexOf(word);
        if (startIndex !== -1) {
          detections.push({
            type: 'NAME',
            value: words[i],
            confidence: 0.60, // Lower confidence for names
            startIndex,
            endIndex: startIndex + words[i].length
          });
        }
      }
    }

    return detections;
  }

  /**
   * Sanitize text by removing/masking PII
   */
  static sanitizeText(text: string, preserveFormat = false): {
    sanitized: string;
    detectionsRemoved: PIIDetection[];
  } {
    if (!this.config.enablePIIDetection) {
      return { sanitized: text, detectionsRemoved: [] };
    }

    const detections = this.detectPII(text);
    let sanitized = text;
    const removed: PIIDetection[] = [];

    // Process detections in reverse order to maintain indices
    for (const detection of detections.reverse()) {
      if (detection.confidence > 0.7) { // Only sanitize high-confidence detections
        const replacement = this.generateReplacement(detection, preserveFormat);
        sanitized = sanitized.substring(0, detection.startIndex) +
                   replacement +
                   sanitized.substring(detection.endIndex);
        removed.push(detection);
      }
    }

    return { sanitized, detectionsRemoved: removed };
  }

  /**
   * Generate appropriate replacement for detected PII
   */
  private static generateReplacement(detection: PIIDetection, preserveFormat: boolean): string {
    if (!preserveFormat) {
      return `[${detection.type}_REDACTED]`;
    }

    switch (detection.type) {
      case 'EMAIL':
        return '[EMAIL@REDACTED.COM]';
      case 'PHONE':
        return '(XXX) XXX-XXXX';
      case 'SSN':
        return 'XXX-XX-XXXX';
      case 'CREDIT_CARD':
        return 'XXXX XXXX XXXX XXXX';
      case 'API_KEY_OPENAI':
        return 'sk-' + 'X'.repeat(48);
      case 'IPV4':
        return 'XXX.XXX.XXX.XXX';
      case 'NAME':
        return '[NAME]';
      default:
        return '[REDACTED]';
    }
  }

  /**
   * Validate and sanitize user input before sending to LLM
   */
  static validateInput(input: string, context = 'user_input'): {
    isValid: boolean;
    sanitizedInput: string;
    violations: DataExposureEvent[];
  } {
    const violations: DataExposureEvent[] = [];

    try {
      // Detect PII in input
      const piiDetections = this.detectPII(input);
      const highRiskDetections = piiDetections.filter(d => d.confidence > 0.8);

      if (highRiskDetections.length > 0) {
        violations.push({
          timestamp: new Date().toISOString(),
          eventType: 'PII_DETECTED',
          severity: 'HIGH',
          details: `High-confidence PII detected in ${context}`,
          data: {
            inputHash: this.hashData(input),
            outputHash: '',
            piiDetected: highRiskDetections
          }
        });
      }

      // Sanitize input
      const { sanitized } = this.sanitizeText(input, true);

      // Log privacy event if enabled
      if (this.config.enableAuditLogging && violations.length > 0) {
        this.logPrivacyEvent(violations[0]);
      }

      return {
        isValid: true, // Allow but sanitize
        sanitizedInput: sanitized,
        violations
      };

    } catch (error) {
      console.error('Privacy validation error:', error);
      return {
        isValid: false,
        sanitizedInput: '[INPUT_VALIDATION_FAILED]',
        violations: [{
          timestamp: new Date().toISOString(),
          eventType: 'PII_DETECTED',
          severity: 'CRITICAL',
          details: 'Privacy validation failed'
        }]
      };
    }
  }

  /**
   * Sanitize LLM output before displaying to user
   */
  static sanitizeOutput(output: string, inputContext?: string): {
    sanitizedOutput: string;
    violations: DataExposureEvent[];
  } {
    if (!this.config.enableOutputSanitization) {
      return { sanitizedOutput: output, violations: [] };
    }

    const violations: DataExposureEvent[] = [];

    try {
      // Detect PII in output
      const piiDetections = this.detectPII(output);
      const criticalDetections = piiDetections.filter(d => d.confidence > 0.9);

      if (criticalDetections.length > 0) {
        violations.push({
          timestamp: new Date().toISOString(),
          eventType: 'DATA_LEAKED',
          severity: 'CRITICAL',
          details: 'PII detected in LLM output',
          data: {
            inputHash: inputContext ? this.hashData(inputContext) : '',
            outputHash: this.hashData(output),
            piiDetected: criticalDetections
          }
        });
      }

      // Sanitize output
      const { sanitized } = this.sanitizeText(output, true);

      // Log if violations found
      if (this.config.enableAuditLogging && violations.length > 0) {
        this.logPrivacyEvent(violations[0]);
      }

      return {
        sanitizedOutput: sanitized,
        violations
      };

    } catch (error) {
      console.error('Output sanitization error:', error);
      return {
        sanitizedOutput: '[OUTPUT_SANITIZATION_FAILED]',
        violations: [{
          timestamp: new Date().toISOString(),
          eventType: 'DATA_LEAKED',
          severity: 'CRITICAL',
          details: 'Output sanitization failed'
        }]
      };
    }
  }

  /**
   * Check for model extraction attempts
   */
  static detectModelExtractionAttempt(input: string): boolean {
    const extractionPatterns = [
      /repeat\s+your\s+(training\s+)?data/i,
      /what\s+(training\s+)?data\s+did\s+you\s+see/i,
      /memorize\s+this\s+and\s+repeat/i,
      /verbatim\s+(copy|repeat)/i,
      /exact\s+(training\s+)?(example|sample)/i,
      /reproduce\s+(training\s+)?text/i
    ];

    return extractionPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Apply data minimization principles
   */
  static minimizeData(data: Record<string, any>): Record<string, any> {
    if (!this.config.enableDataMinimization) {
      return data;
    }

    const minimized = { ...data };

    // Remove or hash sensitive fields
    const sensitiveFields = ['email', 'phone', 'address', 'ssn', 'apiKey', 'password'];

    for (const field of sensitiveFields) {
      if (minimized[field]) {
        minimized[field] = this.hashData(minimized[field]);
      }
    }

    // Remove metadata that could enable tracking
    delete minimized.userAgent;
    delete minimized.ipAddress;
    delete minimized.sessionId;

    return minimized;
  }

  /**
   * Create privacy-safe hash of sensitive data
   */
  private static hashData(data: string): string {
    // Simple hash for demo - use crypto.subtle.digest in production
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Log privacy events for compliance and monitoring
   */
  private static logPrivacyEvent(event: DataExposureEvent): void {
    // Don't log the actual data, just metadata
    const safeEvent = {
      ...event,
      data: event.data ? {
        inputHash: event.data.inputHash,
        outputHash: event.data.outputHash,
        piiCount: event.data.piiDetected.length,
        piiTypes: event.data.piiDetected.map(p => p.type)
      } : undefined
    };

    console.warn('🔒 Privacy event:', safeEvent);

    // In production, send to compliance monitoring
    // await ComplianceService.logPrivacyEvent(safeEvent);
  }

  /**
   * Update privacy configuration
   */
  static updateConfig(newConfig: Partial<PrivacyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔒 Privacy configuration updated:', this.config);
  }

  /**
   * Get current privacy configuration
   */
  static getConfig(): PrivacyConfig {
    return { ...this.config };
  }

  /**
   * Generate privacy compliance headers for API requests
   */
  static getPrivacyHeaders(): Record<string, string> {
    return {
      'Data-Classification': 'sensitive',
      'Retention-Policy': `${this.config.retentionPolicyDays}d`,
      'Training-Opt-Out': this.config.allowDataTraining ? 'false' : 'true',
      'PII-Detection': this.config.enablePIIDetection ? 'enabled' : 'disabled'
    };
  }
}

export { DataPrivacyService, type PIIDetection, type PrivacyConfig, type DataExposureEvent };