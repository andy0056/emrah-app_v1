/**
 * Secure API Proxy Service
 *
 * This service handles API calls through a secure proxy to avoid exposing
 * API keys in the browser. In production, this should be implemented as
 * a backend service.
 */

export interface ProxyRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

export interface ProxyResponse<T = any> {
  data: T;
  status: number;
  error?: string;
}

class ApiProxyService {
  private baseUrl: string;

  constructor() {
    // In development, we'll use a local proxy server
    // In production, this should point to your backend API
    this.baseUrl = import.meta.env.VITE_API_PROXY_URL || '/api/proxy';
  }

  /**
   * Make a secure API call through the proxy
   */
  async request<T = any>(request: ProxyRequest): Promise<ProxyResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}/${request.endpoint}`, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers,
        },
        body: request.body ? JSON.stringify(request.body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null as T,
          status: response.status,
          error: data.error || 'Request failed',
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      console.error('API Proxy Error:', error);
      return {
        data: null as T,
        status: 500,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Secure OpenAI API call
   */
  async callOpenAI(payload: any): Promise<ProxyResponse> {
    return this.request({
      endpoint: 'openai/chat/completions',
      method: 'POST',
      body: payload,
    });
  }

  /**
   * Secure FAL AI API call
   */
  async callFalAI(endpoint: string, payload: any): Promise<ProxyResponse> {
    return this.request({
      endpoint: `fal/${endpoint}`,
      method: 'POST',
      body: payload,
    });
  }
}

export const apiProxy = new ApiProxyService();