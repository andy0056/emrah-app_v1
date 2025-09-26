/**
 * Secure API Proxy Service
 * Routes all AI API calls through a secure backend
 * NEVER expose API keys in client-side code
 */

const API_PROXY_URL = import.meta.env.VITE_API_PROXY_URL || 'http://localhost:3001/api';

interface ProxyRequest {
  service: 'fal' | 'openai';
  endpoint: string;
  payload: any;
}

interface ProxyResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class SecureAPIProxy {
  /**
   * Make secure API call through backend proxy
   */
  static async request<T = any>(request: ProxyRequest): Promise<ProxyResponse<T>> {
    try {
      const response = await fetch(`${API_PROXY_URL}/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add CSRF token for security
          'X-CSRF-Token': await this.getCSRFToken()
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Proxy request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Proxy request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown proxy error'
      };
    }
  }

  /**
   * Get CSRF token for request security
   */
  private static async getCSRFToken(): Promise<string> {
    // Implement CSRF token retrieval
    // This should come from your backend
    return 'csrf-token-placeholder';
  }

  /**
   * Call Fal.ai through secure proxy
   */
  static async callFal(endpoint: string, payload: any): Promise<ProxyResponse> {
    return this.request({
      service: 'fal',
      endpoint,
      payload
    });
  }

  /**
   * Call OpenAI through secure proxy
   */
  static async callOpenAI(endpoint: string, payload: any): Promise<ProxyResponse> {
    return this.request({
      service: 'openai',
      endpoint,
      payload
    });
  }
}
