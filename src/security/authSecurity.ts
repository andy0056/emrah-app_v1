/**
 * API Key & Authentication Security
 *
 * Prevents:
 * - API key leakage/misuse
 * - Broken authentication/authorization
 * - Credential theft and abuse
 * - Session hijacking
 */

interface SecurityHeaders {
  'X-API-Version': string;
  'X-Request-ID': string;
  'X-Timestamp': string;
  'X-Client-Hash': string;
  'Authorization'?: string;
}

interface RateLimitConfig {
  requests: number;
  windowMs: number;
  skipSuccessfulRequests: boolean;
}

interface AuthSecurityConfig {
  enableKeyRotation: boolean;
  enableRateLimit: boolean;
  enableRequestSigning: boolean;
  enableSessionValidation: boolean;
  maxFailedAttempts: number;
  lockoutDurationMs: number;
  keyExpiryHours: number;
}

interface SecurityEvent {
  type: 'KEY_EXPOSURE' | 'AUTH_FAILURE' | 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_ACTIVITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  details: string;
  metadata?: Record<string, any>;
}

class AuthSecurityService {
  private static config: AuthSecurityConfig = {
    enableKeyRotation: true,
    enableRateLimit: true,
    enableRequestSigning: true,
    enableSessionValidation: true,
    maxFailedAttempts: 5,
    lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
    keyExpiryHours: 24
  };

  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  private static failedAttempts = new Map<string, { count: number; lockedUntil?: number }>();
  private static activeKeys = new Set<string>();
  private static revokedKeys = new Set<string>();

  // Rate limiting configurations for different endpoints
  private static rateLimits: Record<string, RateLimitConfig> = {
    '/api/ai/generate': { requests: 10, windowMs: 60000, skipSuccessfulRequests: false }, // 10 req/min
    '/api/ai/chat': { requests: 20, windowMs: 60000, skipSuccessfulRequests: false }, // 20 req/min
    '/api/upload': { requests: 5, windowMs: 300000, skipSuccessfulRequests: true }, // 5 req/5min
    'default': { requests: 100, windowMs: 60000, skipSuccessfulRequests: false } // 100 req/min
  };

  /**
   * Secure API key validation and verification
   */
  static validateAPIKey(key: string, endpoint?: string): {
    isValid: boolean;
    violations: SecurityEvent[];
    metadata?: Record<string, any>;
  } {
    const violations: SecurityEvent[] = [];

    try {
      // Check for client-side key exposure (critical security flaw)
      if (this.isClientSideExposed(key)) {
        violations.push({
          type: 'KEY_EXPOSURE',
          severity: 'CRITICAL',
          timestamp: new Date().toISOString(),
          details: 'API key detected in client-side code - immediate security risk',
          metadata: { endpoint, keyPrefix: key.substring(0, 8) + '...' }
        });
        return { isValid: false, violations };
      }

      // Validate key format and structure
      if (!this.validateKeyFormat(key)) {
        violations.push({
          type: 'AUTH_FAILURE',
          severity: 'HIGH',
          timestamp: new Date().toISOString(),
          details: 'Invalid API key format',
          metadata: { endpoint }
        });
        return { isValid: false, violations };
      }

      // Check if key is revoked
      if (this.revokedKeys.has(this.hashKey(key))) {
        violations.push({
          type: 'AUTH_FAILURE',
          severity: 'HIGH',
          timestamp: new Date().toISOString(),
          details: 'API key has been revoked',
          metadata: { endpoint }
        });
        return { isValid: false, violations };
      }

      // Check key expiry (if rotation enabled)
      if (this.config.enableKeyRotation && this.isKeyExpired(key)) {
        violations.push({
          type: 'AUTH_FAILURE',
          severity: 'MEDIUM',
          timestamp: new Date().toISOString(),
          details: 'API key has expired',
          metadata: { endpoint }
        });
        return { isValid: false, violations };
      }

      return { isValid: true, violations };

    } catch (error) {
      violations.push({
        type: 'AUTH_FAILURE',
        severity: 'CRITICAL',
        timestamp: new Date().toISOString(),
        details: 'API key validation failed',
        metadata: { endpoint, error: String(error) }
      });
      return { isValid: false, violations };
    }
  }

  /**
   * Check if API key is exposed in client-side code
   */
  private static isClientSideExposed(key: string): boolean {
    // Check if running in browser environment
    if (typeof window !== 'undefined') {
      console.error('🚨 CRITICAL SECURITY VIOLATION: API key detected in browser environment!');
      console.error('🚨 This is a severe security risk - API keys should NEVER be in client-side code');
      return true;
    }

    // Additional checks for common client-side exposure patterns
    const dangerousPatterns = [
      'VITE_',
      'REACT_APP_',
      'NEXT_PUBLIC_',
      'process.env'
    ];

    // This is a heuristic check - in production, implement more sophisticated detection
    const callStack = new Error().stack || '';
    return dangerousPatterns.some(pattern => callStack.includes(pattern));
  }

  /**
   * Validate API key format
   */
  private static validateKeyFormat(key: string): boolean {
    // OpenAI key format: sk-...
    if (key.startsWith('sk-') && key.length === 51) return true;

    // FAL AI key format
    if (key.length >= 32 && /^[a-f0-9-]+$/i.test(key)) return true;

    // Generic secure key format
    if (key.length >= 32 && /^[A-Za-z0-9_-]+$/.test(key)) return true;

    return false;
  }

  /**
   * Check if key has expired
   */
  private static isKeyExpired(key: string): boolean {
    // In production, check against key creation timestamp from secure storage
    // For now, implement basic time-based check
    const keyHash = this.hashKey(key);
    // This would typically be stored in secure backend with creation timestamp
    return false; // Placeholder - implement with actual key lifecycle management
  }

  /**
   * Rate limiting implementation
   */
  static checkRateLimit(clientId: string, endpoint: string = 'default'): {
    allowed: boolean;
    violations: SecurityEvent[];
    resetTime?: number;
    remainingRequests?: number;
  } {
    if (!this.config.enableRateLimit) {
      return { allowed: true, violations: [] };
    }

    const violations: SecurityEvent[] = [];
    const config = this.rateLimits[endpoint] || this.rateLimits.default;
    const now = Date.now();
    const key = `${clientId}:${endpoint}`;

    // Get or create rate limit entry
    let entry = this.rateLimitStore.get(key);

    // Reset window if expired
    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + config.windowMs };
      this.rateLimitStore.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= config.requests) {
      violations.push({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'MEDIUM',
        timestamp: new Date().toISOString(),
        details: `Rate limit exceeded for endpoint ${endpoint}`,
        metadata: {
          clientId,
          endpoint,
          requests: entry.count,
          limit: config.requests,
          resetTime: entry.resetTime
        }
      });

      return {
        allowed: false,
        violations,
        resetTime: entry.resetTime,
        remainingRequests: 0
      };
    }

    // Increment counter
    entry.count++;
    this.rateLimitStore.set(key, entry);

    return {
      allowed: true,
      violations,
      resetTime: entry.resetTime,
      remainingRequests: config.requests - entry.count
    };
  }

  /**
   * Track and prevent brute force attacks
   */
  static trackFailedAuth(clientId: string): {
    locked: boolean;
    violations: SecurityEvent[];
    lockedUntil?: number;
  } {
    const violations: SecurityEvent[] = [];
    const now = Date.now();

    let attempts = this.failedAttempts.get(clientId);

    // Reset if lockout expired
    if (attempts?.lockedUntil && now > attempts.lockedUntil) {
      attempts = undefined;
      this.failedAttempts.delete(clientId);
    }

    // Check if already locked
    if (attempts?.lockedUntil && now < attempts.lockedUntil) {
      violations.push({
        type: 'AUTH_FAILURE',
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
        details: 'Client is temporarily locked due to repeated failures',
        metadata: { clientId, lockedUntil: attempts.lockedUntil }
      });
      return { locked: true, violations, lockedUntil: attempts.lockedUntil };
    }

    // Increment failed attempts
    const count = (attempts?.count || 0) + 1;

    // Lock if exceeded max attempts
    if (count >= this.config.maxFailedAttempts) {
      const lockedUntil = now + this.config.lockoutDurationMs;
      this.failedAttempts.set(clientId, { count, lockedUntil });

      violations.push({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
        details: `Client locked after ${count} failed authentication attempts`,
        metadata: { clientId, lockedUntil }
      });

      return { locked: true, violations, lockedUntil };
    }

    // Update failed attempts
    this.failedAttempts.set(clientId, { count });

    violations.push({
      type: 'AUTH_FAILURE',
      severity: 'MEDIUM',
      timestamp: new Date().toISOString(),
      details: `Authentication failure ${count}/${this.config.maxFailedAttempts}`,
      metadata: { clientId, attempt: count }
    });

    return { locked: false, violations };
  }

  /**
   * Generate secure request headers
   */
  static generateSecureHeaders(endpoint: string): SecurityHeaders {
    const timestamp = new Date().toISOString();
    const requestId = this.generateRequestId();
    const clientHash = this.generateClientHash();

    return {
      'X-API-Version': '1.0',
      'X-Request-ID': requestId,
      'X-Timestamp': timestamp,
      'X-Client-Hash': clientHash
    };
  }

  /**
   * Validate request signature to prevent tampering
   */
  static validateRequestSignature(headers: Record<string, string>, body?: string): boolean {
    if (!this.config.enableRequestSigning) return true;

    try {
      const expectedHash = this.generateRequestHash(headers, body);
      const providedHash = headers['X-Request-Hash'];

      return expectedHash === providedHash;
    } catch {
      return false;
    }
  }

  /**
   * Securely revoke API key
   */
  static revokeKey(key: string, reason: string): void {
    const keyHash = this.hashKey(key);
    this.revokedKeys.add(keyHash);
    this.activeKeys.delete(keyHash);

    console.warn('🔑 API key revoked:', {
      keyPrefix: key.substring(0, 8) + '...',
      reason,
      timestamp: new Date().toISOString()
    });

    // In production, notify security monitoring service
    // await SecurityService.notifyKeyRevocation(keyHash, reason);
  }

  /**
   * Generate secure client fingerprint
   */
  private static generateClientHash(): string {
    // In browser environment, use available fingerprinting data
    if (typeof window !== 'undefined') {
      const data = [
        window.navigator.userAgent,
        window.screen.width + 'x' + window.screen.height,
        new Date().getTimezoneOffset(),
        window.navigator.language
      ].join('|');

      return this.hashData(data);
    }

    // Server-side fallback
    return this.hashData(process.version + process.platform + new Date().toDateString());
  }

  /**
   * Generate unique request ID
   */
  private static generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `req_${timestamp}_${random}`;
  }

  /**
   * Generate request hash for integrity verification
   */
  private static generateRequestHash(headers: Record<string, string>, body?: string): string {
    const data = [
      headers['X-Request-ID'] || '',
      headers['X-Timestamp'] || '',
      headers['X-Client-Hash'] || '',
      body || ''
    ].join('|');

    return this.hashData(data);
  }

  /**
   * Secure hash function
   */
  private static hashKey(key: string): string {
    return this.hashData(key + 'salt_for_key_hashing');
  }

  /**
   * Generic secure hashing
   */
  private static hashData(data: string): string {
    // Simple hash for demo - use crypto.subtle.digest in production
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Clean up expired entries periodically
   */
  static cleanup(): void {
    const now = Date.now();

    // Clean rate limits
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }

    // Clean failed attempts
    for (const [clientId, attempts] of this.failedAttempts.entries()) {
      if (attempts.lockedUntil && now > attempts.lockedUntil) {
        this.failedAttempts.delete(clientId);
      }
    }
  }

  /**
   * Update security configuration
   */
  static updateConfig(newConfig: Partial<AuthSecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔒 Auth security configuration updated:', this.config);
  }

  /**
   * Get current configuration
   */
  static getConfig(): AuthSecurityConfig {
    return { ...this.config };
  }
}

// Setup periodic cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(() => AuthSecurityService.cleanup(), 5 * 60 * 1000); // Every 5 minutes
}

export { AuthSecurityService, type SecurityEvent, type AuthSecurityConfig, type SecurityHeaders };