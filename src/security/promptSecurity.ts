/**
 * LLM Prompt Security & Injection Protection
 *
 * Critical security layer to prevent:
 * - Prompt injection attacks
 * - Jailbreaking attempts
 * - System prompt leaks
 * - Model manipulation
 */

interface SecurityViolation {
  type: 'PROMPT_INJECTION' | 'JAILBREAK_ATTEMPT' | 'SYSTEM_LEAK' | 'MALICIOUS_CONTENT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  blocked: boolean;
  originalInput: string;
  sanitizedInput?: string;
}

interface SecurityConfig {
  enableInjectionProtection: boolean;
  enableJailbreakDetection: boolean;
  enableSystemLeakPrevention: boolean;
  enableContentFiltering: boolean;
  logSecurityEvents: boolean;
  blockOnViolation: boolean;
  maxPromptLength: number;
}

class PromptSecurityService {
  private static config: SecurityConfig = {
    enableInjectionProtection: true,
    enableJailbreakDetection: true,
    enableSystemLeakPrevention: true,
    enableContentFiltering: true,
    logSecurityEvents: true,
    blockOnViolation: true,
    maxPromptLength: 4000
  };

  // Known prompt injection patterns
  private static readonly INJECTION_PATTERNS = [
    // Direct instruction override attempts
    /ignore\s+(previous|all)\s+instructions?/i,
    /forget\s+(everything|all)\s+(above|before)/i,
    /disregard\s+(previous|all)\s+(instructions?|rules?)/i,
    /new\s+instructions?:/i,
    /system\s*:\s*/i,
    /user\s*:\s*/i,
    /assistant\s*:\s*/i,

    // Role confusion attempts
    /you\s+are\s+now\s+(a|an)/i,
    /act\s+as\s+(a|an)/i,
    /pretend\s+to\s+be/i,
    /roleplay\s+as/i,

    // Information extraction attempts
    /what\s+(are\s+)?your\s+(instructions|rules|guidelines)/i,
    /tell\s+me\s+your\s+(system\s+)?prompt/i,
    /reveal\s+your\s+(instructions|prompt)/i,
    /show\s+me\s+your\s+(code|instructions)/i,

    // Jailbreak attempts
    /dan\s+mode/i,
    /developer\s+mode/i,
    /jailbreak/i,
    /bypass\s+(safety|security|filters?)/i,

    // Content manipulation
    /generate\s+(harmful|illegal|inappropriate)/i,
    /create\s+(malware|virus|exploit)/i,
    /how\s+to\s+(hack|break|exploit)/i
  ];

  // Jailbreak technique patterns
  private static readonly JAILBREAK_PATTERNS = [
    // DAN (Do Anything Now) variants
    /do\s+anything\s+now/i,
    /\bdan\b/i,
    /jailbroken/i,

    // Character roleplay attempts
    /evil\s+(ai|assistant|chatbot)/i,
    /unrestricted\s+(ai|mode)/i,
    /no\s+(rules|restrictions|limitations)/i,

    // Hypothetical scenarios
    /in\s+a\s+hypothetical\s+world/i,
    /imagine\s+if\s+you\s+(could|were)/i,
    /what\s+if\s+you\s+(weren't|didn't\s+have)/i,

    // Base64/encoding attempts
    /base64\s*:/i,
    /decode\s+this/i,
    /\b[A-Za-z0-9+/]{20,}={0,2}\b/ // Base64 pattern
  ];

  // System information leak patterns
  private static readonly SYSTEM_LEAK_PATTERNS = [
    /system\s+(prompt|message|instructions?)/i,
    /initial\s+(prompt|instructions?)/i,
    /configuration\s+(file|settings?)/i,
    /hidden\s+(instructions?|prompt)/i,
    /internal\s+(prompt|system)/i,
    /backstage\s+(instructions?|prompt)/i
  ];

  // Sensitive content patterns
  private static readonly SENSITIVE_PATTERNS = [
    // Personal information
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email

    // API keys and tokens
    /sk-[a-zA-Z0-9]{48}/, // OpenAI API key
    /xapp-[a-zA-Z0-9-]{36}/, // Various app keys
    /[a-f0-9]{32}/, // Generic hex tokens

    // Internal system references
    /localhost:\d+/i,
    /127\.0\.0\.1/i,
    /\.env/i,
    /config\.json/i
  ];

  /**
   * Main security validation function
   */
  static validatePrompt(input: string, context?: string): {
    isValid: boolean;
    violations: SecurityViolation[];
    sanitizedInput?: string;
  } {
    const violations: SecurityViolation[] = [];
    let sanitizedInput = input;

    try {
      // Length validation
      if (input.length > this.config.maxPromptLength) {
        violations.push({
          type: 'MALICIOUS_CONTENT',
          severity: 'MEDIUM',
          description: `Prompt exceeds maximum length (${this.config.maxPromptLength} characters)`,
          blocked: true,
          originalInput: input.substring(0, 100) + '...'
        });
      }

      // Prompt injection detection
      if (this.config.enableInjectionProtection) {
        const injectionViolations = this.detectPromptInjection(input);
        violations.push(...injectionViolations);
      }

      // Jailbreak detection
      if (this.config.enableJailbreakDetection) {
        const jailbreakViolations = this.detectJailbreakAttempts(input);
        violations.push(...jailbreakViolations);
      }

      // System leak prevention
      if (this.config.enableSystemLeakPrevention) {
        const leakViolations = this.detectSystemLeaks(input);
        violations.push(...leakViolations);
      }

      // Content filtering
      if (this.config.enableContentFiltering) {
        const contentViolations = this.detectSensitiveContent(input);
        violations.push(...contentViolations);
        sanitizedInput = this.sanitizeInput(input);
      }

      // Log security events
      if (this.config.logSecurityEvents && violations.length > 0) {
        this.logSecurityViolations(violations, context);
      }

      const hasBlockingViolations = violations.some(v => v.blocked && v.severity === 'CRITICAL');

      return {
        isValid: !hasBlockingViolations || !this.config.blockOnViolation,
        violations,
        sanitizedInput: hasBlockingViolations ? undefined : sanitizedInput
      };

    } catch (error) {
      console.error('Security validation error:', error);
      // Fail closed - block if validation fails
      return {
        isValid: false,
        violations: [{
          type: 'MALICIOUS_CONTENT',
          severity: 'CRITICAL',
          description: 'Security validation failed',
          blocked: true,
          originalInput: input.substring(0, 100) + '...'
        }]
      };
    }
  }

  /**
   * Detect prompt injection attempts
   */
  private static detectPromptInjection(input: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        violations.push({
          type: 'PROMPT_INJECTION',
          severity: 'CRITICAL',
          description: `Detected prompt injection pattern: ${pattern.source}`,
          blocked: true,
          originalInput: input
        });
      }
    }

    return violations;
  }

  /**
   * Detect jailbreak attempts
   */
  private static detectJailbreakAttempts(input: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    for (const pattern of this.JAILBREAK_PATTERNS) {
      if (pattern.test(input)) {
        violations.push({
          type: 'JAILBREAK_ATTEMPT',
          severity: 'CRITICAL',
          description: `Detected jailbreak attempt: ${pattern.source}`,
          blocked: true,
          originalInput: input
        });
      }
    }

    return violations;
  }

  /**
   * Detect system information leaks
   */
  private static detectSystemLeaks(input: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    for (const pattern of this.SYSTEM_LEAK_PATTERNS) {
      if (pattern.test(input)) {
        violations.push({
          type: 'SYSTEM_LEAK',
          severity: 'HIGH',
          description: `Potential system information leak: ${pattern.source}`,
          blocked: true,
          originalInput: input
        });
      }
    }

    return violations;
  }

  /**
   * Detect sensitive content
   */
  private static detectSensitiveContent(input: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    for (const pattern of this.SENSITIVE_PATTERNS) {
      if (pattern.test(input)) {
        violations.push({
          type: 'MALICIOUS_CONTENT',
          severity: 'HIGH',
          description: `Sensitive content detected: ${pattern.source}`,
          blocked: false, // Log but don't block, sanitize instead
          originalInput: input
        });
      }
    }

    return violations;
  }

  /**
   * Sanitize input by removing/masking sensitive content
   */
  private static sanitizeInput(input: string): string {
    let sanitized = input;

    // Mask email addresses
    sanitized = sanitized.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      '[EMAIL_REDACTED]'
    );

    // Mask SSNs
    sanitized = sanitized.replace(
      /\b\d{3}-\d{2}-\d{4}\b/g,
      '[SSN_REDACTED]'
    );

    // Mask credit cards
    sanitized = sanitized.replace(
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g,
      '[CARD_REDACTED]'
    );

    // Mask API keys
    sanitized = sanitized.replace(
      /sk-[a-zA-Z0-9]{48}/g,
      '[API_KEY_REDACTED]'
    );

    // Mask localhost references
    sanitized = sanitized.replace(
      /localhost:\d+/gi,
      '[LOCALHOST_REDACTED]'
    );

    return sanitized;
  }

  /**
   * Log security violations for monitoring
   */
  private static logSecurityViolations(violations: SecurityViolation[], context?: string): void {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      context: context || 'unknown',
      violations: violations.map(v => ({
        type: v.type,
        severity: v.severity,
        description: v.description,
        blocked: v.blocked
      })),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      ip: 'masked' // In production, log actual IP for security monitoring
    };

    console.warn('🚨 Security violation detected:', securityEvent);

    // In production, send to security monitoring service
    // await SecurityMonitoringService.logViolation(securityEvent);
  }

  /**
   * Update security configuration
   */
  static updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔒 Security configuration updated:', this.config);
  }

  /**
   * Get current security configuration
   */
  static getConfig(): SecurityConfig {
    return { ...this.config };
  }
}

export { PromptSecurityService, type SecurityViolation, type SecurityConfig };