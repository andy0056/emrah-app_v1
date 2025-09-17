import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SecurityUtils } from '../security';

describe('SecurityUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CSRF Token Management', () => {
    it('should generate a new CSRF token', async () => {
      const token = await SecurityUtils.generateCSRFToken();

      expect(token).toBe('mock-uuid-1234');
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'csrf_token',
        expect.stringContaining('mock-uuid-1234')
      );
    });

    it('should return existing valid CSRF token', async () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      const tokenData = {
        token: 'existing-token',
        expires_at: futureTime.toISOString()
      };

      vi.mocked(sessionStorage.getItem).mockReturnValue(JSON.stringify(tokenData));

      const token = await SecurityUtils.getCSRFToken();
      expect(token).toBe('existing-token');
    });

    it('should generate new token when current token is expired', async () => {
      const pastTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const expiredTokenData = {
        token: 'expired-token',
        expires_at: pastTime.toISOString()
      };

      vi.mocked(sessionStorage.getItem).mockReturnValue(JSON.stringify(expiredTokenData));

      const token = await SecurityUtils.getCSRFToken();
      expect(token).toBe('mock-uuid-1234');
    });

    it('should validate correct CSRF token', () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000);
      const tokenData = {
        token: 'valid-token',
        expires_at: futureTime.toISOString()
      };

      vi.mocked(sessionStorage.getItem).mockReturnValue(JSON.stringify(tokenData));

      const isValid = SecurityUtils.validateCSRFToken('valid-token');
      expect(isValid).toBe(true);
    });

    it('should reject invalid CSRF token', () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000);
      const tokenData = {
        token: 'valid-token',
        expires_at: futureTime.toISOString()
      };

      vi.mocked(sessionStorage.getItem).mockReturnValue(JSON.stringify(tokenData));

      const isValid = SecurityUtils.validateCSRFToken('invalid-token');
      expect(isValid).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize malicious script tags', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = SecurityUtils.sanitizeInput(maliciousInput);

      expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should handle non-string input', () => {
      const result = SecurityUtils.sanitizeInput(123 as any);
      expect(result).toBe('');
    });

    it('should trim whitespace', () => {
      const input = '  normal text  ';
      const result = SecurityUtils.sanitizeInput(input);
      expect(result).toBe('normal text');
    });
  });

  describe('File Upload Validation', () => {
    it('should accept valid image files', () => {
      const validFile = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
      const result = SecurityUtils.validateFileUpload(validFile);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files that are too large', () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg'
      });
      const result = SecurityUtils.validateFileUpload(largeFile);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size too large');
    });

    it('should reject invalid file types', () => {
      const invalidFile = new File(['content'], 'script.js', { type: 'application/javascript' });
      const result = SecurityUtils.validateFileUpload(invalidFile);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject suspicious file extensions', () => {
      const suspiciousFile = new File(['content'], 'malware.exe', { type: 'image/jpeg' });
      const result = SecurityUtils.validateFileUpload(suspiciousFile);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file extension');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow operations within rate limit', () => {
      const result = SecurityUtils.checkRateLimit('test_operation', 5, 60000);
      expect(result).toBe(true);
    });

    it('should block operations that exceed rate limit', () => {
      // Mock sessionStorage to store rate limit data
      const storedData: string[] = [];
      vi.mocked(sessionStorage.getItem).mockImplementation((key) => {
        if (key === 'rate_limit_test_operation_2') {
          return JSON.stringify(storedData);
        }
        return null;
      });
      vi.mocked(sessionStorage.setItem).mockImplementation((key, value) => {
        if (key === 'rate_limit_test_operation_2') {
          const data = JSON.parse(value);
          storedData.splice(0, storedData.length, ...data);
        }
      });

      // Fill up the rate limit
      for (let i = 0; i < 5; i++) {
        SecurityUtils.checkRateLimit('test_operation_2', 5, 60000);
      }

      // This should be blocked
      const result = SecurityUtils.checkRateLimit('test_operation_2', 5, 60000);
      expect(result).toBe(false);
    });

    it('should reset rate limit after time window', () => {
      // Mock Date.now to control time
      const originalNow = Date.now;
      let currentTime = 1000000;
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

      // Fill up rate limit
      for (let i = 0; i < 5; i++) {
        SecurityUtils.checkRateLimit('test_operation_3', 5, 60000);
      }

      // Move time forward beyond window
      currentTime += 61000; // 61 seconds

      // Should allow again
      const result = SecurityUtils.checkRateLimit('test_operation_3', 5, 60000);
      expect(result).toBe(true);

      // Restore Date.now
      Date.now = originalNow;
    });
  });

  describe('Security Headers', () => {
    it('should return proper security headers', () => {
      const headers = SecurityUtils.getSecurityHeaders();

      expect(headers).toHaveProperty('Content-Security-Policy');
      expect(headers).toHaveProperty('X-Frame-Options', 'DENY');
      expect(headers).toHaveProperty('X-Content-Type-Options', 'nosniff');
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    });
  });
});