/**
 * Secure API Client
 * Routes all sensitive API calls through secure backend proxy
 */

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  requestId?: string;
  timestamp?: string;
}

interface ProxyConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

class SecureApiClient {
  private config: ProxyConfig;

  constructor(config?: Partial<ProxyConfig>) {
    this.config = {
      baseUrl: import.meta.env.VITE_API_PROXY_URL || 'http://localhost:3001',
      timeout: 30000, // 30 seconds
      retries: 3,
      ...config
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed (attempt ${retryCount + 1}):`, error);

      // Retry logic for network errors
      if (retryCount < this.config.retries && this.shouldRetry(error)) {
        await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
        return this.makeRequest(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  private shouldRetry(error: unknown): boolean {
    if (error instanceof Error) {
      // Retry on network errors, timeouts, and 5xx errors
      return error.name === 'NetworkError' ||
             error.name === 'TimeoutError' ||
             error.message.includes('fetch');
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * OpenAI Chat Completions
   */
  async openaiChatCompletion(messages: any[], options: any = {}): Promise<any> {
    return this.makeRequest('/api/openai/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.1,
        ...options
      })
    });
  }

  /**
   * FAL Image Generation
   */
  async falImageGeneration(modelId: string, input: any): Promise<any> {
    return this.makeRequest(`/api/fal/${modelId}`, {
      method: 'POST',
      body: JSON.stringify({ input })
    });
  }

  /**
   * FAL Queue Subscription
   */
  async falQueueSubscribe(modelId: string, input: any): Promise<any> {
    return this.makeRequest(`/api/fal-queue/${modelId}`, {
      method: 'POST',
      body: JSON.stringify({ input })
    });
  }

  /**
   * Custom prompt compression endpoint
   */
  async compressPrompt(prompt: string, maxLength?: number): Promise<{
    originalPrompt: string;
    compressedPrompt: string;
    originalLength: number;
    compressedLength: number;
    compressionRatio: number;
  }> {
    return this.makeRequest('/api/compress-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt, maxLength })
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    return this.makeRequest('/health');
  }

  /**
   * Test connection to proxy
   */
  async testConnection(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const secureApiClient = new SecureApiClient();

// Legacy compatibility - gradually replace direct API calls
export class SecureApiService {
  /**
   * Replace OpenAI direct calls with proxy calls
   */
  static async generateCompletion(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<string> {
    try {
      const response = await secureApiClient.openaiChatCompletion([
        { role: 'user', content: prompt }
      ], {
        model: options.model || 'gpt-3.5-turbo',
        max_tokens: options.maxTokens || 500,
        temperature: options.temperature || 0.1
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Secure OpenAI completion failed:', error);
      throw new Error(`AI completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Replace FAL direct calls with proxy calls
   */
  static async generateImage(
    modelId: string,
    prompt: string,
    options: any = {}
  ): Promise<any> {
    try {
      return await secureApiClient.falImageGeneration(modelId, {
        prompt,
        ...options
      });
    } catch (error) {
      console.error('Secure FAL generation failed:', error);
      throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Intelligent prompt compression using proxy
   */
  static async compressPromptIntelligently(
    prompt: string,
    targetLength: number = 2000
  ): Promise<string> {
    try {
      const result = await secureApiClient.compressPrompt(prompt, targetLength);

      console.log('🧠 Intelligent prompt compression:', {
        originalLength: result.originalLength,
        compressedLength: result.compressedLength,
        ratio: `${(result.compressionRatio * 100).toFixed(1)}%`
      });

      return result.compressedPrompt;
    } catch (error) {
      console.warn('Intelligent compression failed, using fallback:', error);
      // Fallback to simple truncation
      return prompt.length > targetLength
        ? prompt.substring(0, targetLength - 3) + '...'
        : prompt;
    }
  }
}

export default secureApiClient;