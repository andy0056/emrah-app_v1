import { SecurityUtils } from '../utils/security';
import { PerformanceUtils } from '../utils/performance';
import type { ApiResponse } from '../types';

/**
 * Secure API service with CSRF protection and rate limiting
 */
export class SecureApiService {
  private static readonly baseHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  /**
   * Make a secure API request with CSRF protection
   */
  static async secureRequest<T = any>(
    url: string,
    options: RequestInit & { 
      requireAuth?: boolean;
      operation?: string;
      skipRateLimit?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> {
    const {
      requireAuth = true,
      operation = 'api_call',
      skipRateLimit = false,
      ...requestOptions
    } = options;

    try {
      // Rate limiting check
      if (!skipRateLimit && !SecurityUtils.checkRateLimit(operation, 10, 60000)) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      // Prepare headers
      const headers = { ...this.baseHeaders, ...requestOptions.headers };

      // Add CSRF token for state-changing operations
      if (requestOptions.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(requestOptions.method)) {
        const csrfToken = await SecurityUtils.generateCSRFToken();
        headers['X-CSRF-Token'] = csrfToken;
      }

      // Add auth header if required
      if (requireAuth) {
        const isValidUser = await SecurityUtils.validateUserAccess();
        if (!isValidUser) {
          throw new Error('Authentication required');
        }
      }

      // Sanitize request body if present
      let body = requestOptions.body;
      if (body && typeof body === 'string') {
        try {
          const parsed = JSON.parse(body);
          const sanitized = this.sanitizeRequestData(parsed);
          body = JSON.stringify(sanitized);
        } catch {
          // If parsing fails, leave body as is
        }
      }

      // Make the request
      const response = await fetch(url, {
        ...requestOptions,
        headers,
        body
      });

      // Handle response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        data,
        error: null,
        success: true,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`SecureApiService: ${operation} failed:`, error);
      
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Sanitize request data to prevent injection attacks
   */
  private static sanitizeRequestData(data: any): any {
    if (typeof data === 'string') {
      return SecurityUtils.sanitizeInput(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeRequestData(item));
    }

    if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[SecurityUtils.sanitizeInput(key)] = this.sanitizeRequestData(value);
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Cached GET request
   */
  static async cachedGet<T = any>(
    url: string,
    cacheKey: string,
    ttl: number = 300000,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Try to get from cache first
    const cached = PerformanceUtils.getCache<ApiResponse<T>>(cacheKey);
    if (cached) {
      return cached;
    }

    // Make the request
    const response = await this.secureRequest<T>(url, {
      ...options,
      method: 'GET',
      operation: 'cached_get'
    });

    // Cache successful responses
    if (response.success) {
      PerformanceUtils.setCache(cacheKey, response, ttl);
    }

    return response;
  }

  /**
   * POST request with CSRF protection
   */
  static async securePost<T = any>(
    url: string,
    data: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.secureRequest<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
      operation: 'secure_post'
    });
  }

  /**
   * PUT request with CSRF protection
   */
  static async securePut<T = any>(
    url: string,
    data: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.secureRequest<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
      operation: 'secure_put'
    });
  }

  /**
   * DELETE request with CSRF protection
   */
  static async secureDelete<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.secureRequest<T>(url, {
      ...options,
      method: 'DELETE',
      operation: 'secure_delete'
    });
  }

  /**
   * Upload file with security validation
   */
  static async secureFileUpload(
    url: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<{ url: string }>> {
    // Validate file
    const validation = SecurityUtils.validateFileUpload(file);
    if (!validation.valid) {
      return {
        data: null,
        error: validation.error || 'File validation failed',
        success: false,
        timestamp: new Date().toISOString()
      };
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      for (const [key, value] of Object.entries(additionalData)) {
        formData.append(key, String(value));
      }
    }

    // Get CSRF token
    const csrfToken = await SecurityUtils.generateCSRFToken();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        data,
        error: null,
        success: true,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Upload failed',
        success: false,
        timestamp: new Date().toISOString()
      };
    }
  }
}