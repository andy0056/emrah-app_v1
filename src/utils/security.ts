import { supabase } from '../services/supabaseClient';
import type { CSRFToken, SecurityHeaders } from '../types';

/**
 * Security utility functions for CSRF protection and validation
 */
export class SecurityUtils {
  private static readonly CSRF_TOKEN_KEY = 'csrf_token';
  private static readonly TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate and store CSRF token
   */
  static async generateCSRFToken(): Promise<string> {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const csrfData: CSRFToken = {
      token,
      expires_at: expiresAt.toISOString()
    };

    sessionStorage.setItem(this.CSRF_TOKEN_KEY, JSON.stringify(csrfData));
    return token;
  }

  /**
   * Get current CSRF token, generate new one if expired
   */
  static async getCSRFToken(): Promise<string> {
    const stored = sessionStorage.getItem(this.CSRF_TOKEN_KEY);
    
    if (!stored) {
      return this.generateCSRFToken();
    }

    try {
      const csrfData: CSRFToken = JSON.parse(stored);
      const expiresAt = new Date(csrfData.expires_at);
      
      // Check if token is expired or will expire soon
      if (Date.now() > expiresAt.getTime() - this.TOKEN_EXPIRY_BUFFER) {
        return this.generateCSRFToken();
      }

      return csrfData.token;
    } catch {
      return this.generateCSRFToken();
    }
  }

  /**
   * Validate CSRF token
   */
  static validateCSRFToken(providedToken: string): boolean {
    const stored = sessionStorage.getItem(this.CSRF_TOKEN_KEY);
    
    if (!stored || !providedToken) {
      return false;
    }

    try {
      const csrfData: CSRFToken = JSON.parse(stored);
      const expiresAt = new Date(csrfData.expires_at);
      
      // Check if token is expired
      if (Date.now() > expiresAt.getTime()) {
        return false;
      }

      return csrfData.token === providedToken;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize user input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  /**
   * Validate file upload security
   */
  static validateFileUpload(file: File): { valid: boolean; error?: string } {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 10;

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only images are allowed.'
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size too large. Maximum 10MB allowed.'
      };
    }

    // Check file name for potential security issues
    const suspiciousExtensions = /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|php|asp|aspx)$/i;
    if (suspiciousExtensions.test(file.name)) {
      return {
        valid: false,
        error: 'Invalid file extension detected.'
      };
    }

    return { valid: true };
  }

  /**
   * Rate limiting check (client-side basic implementation)
   */
  static checkRateLimit(operation: string, limit: number = 5, windowMs: number = 60000): boolean {
    const key = `rate_limit_${operation}`;
    const now = Date.now();
    
    const stored = sessionStorage.getItem(key);
    let attempts: number[] = stored ? JSON.parse(stored) : [];
    
    // Filter out old attempts outside the window
    attempts = attempts.filter(timestamp => now - timestamp < windowMs);
    
    if (attempts.length >= limit) {
      return false; // Rate limit exceeded
    }
    
    // Add current attempt
    attempts.push(now);
    sessionStorage.setItem(key, JSON.stringify(attempts));
    
    return true;
  }

  /**
   * Secure headers configuration for deployment
   */
  static getSecurityHeaders(): SecurityHeaders {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.supabase.co https://*.fal.ai https://*.openai.com",
        "frame-ancestors 'none'"
      ].join('; '),
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  }

  /**
   * Validate user session and permissions
   */
  static async validateUserAccess(requiredPermission?: string): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return false;
      }

      // Check if session is still valid
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && now >= session.expires_at) {
        return false;
      }

      // Additional permission checks could be added here
      if (requiredPermission) {
        // Implementation would depend on your permission system
        return true;
      }

      return true;
    } catch {
      return false;
    }
  }
}