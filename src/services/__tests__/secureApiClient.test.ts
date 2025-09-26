/**
 * Secure API Client Tests
 */

import { secureApiClient, SecureApiService } from '../secureApiClient';

describe('SecureApiClient', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('healthCheck', () => {
    it('should return health status when API is healthy', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00.000Z',
        version: '1.0.0'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await secureApiClient.healthCheck();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/health',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(secureApiClient.healthCheck()).rejects.toThrow('Network error');
    });
  });

  describe('testConnection', () => {
    it('should return true when connection is healthy', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' })
      });

      const result = await secureApiClient.testConnection();
      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));

      const result = await secureApiClient.testConnection();
      expect(result).toBe(false);
    });
  });
});

describe('SecureApiService', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('generateCompletion', () => {
    it('should generate AI completion via proxy', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This is a test completion'
            }
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await SecureApiService.generateCompletion('Test prompt');

      expect(result).toBe('This is a test completion');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/openai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Test prompt' }],
            max_tokens: 500,
            temperature: 0.1
          })
        })
      );
    });

    it('should handle API errors with meaningful messages', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('API rate limit exceeded')
      );

      await expect(
        SecureApiService.generateCompletion('Test prompt')
      ).rejects.toThrow('AI completion failed: API rate limit exceeded');
    });
  });

  describe('compressPromptIntelligently', () => {
    it('should compress prompt using AI', async () => {
      const mockResponse = {
        originalPrompt: 'Long prompt text here',
        compressedPrompt: 'Short prompt',
        originalLength: 100,
        compressedLength: 50,
        compressionRatio: 0.5
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await SecureApiService.compressPromptIntelligently(
        'Long prompt text here',
        50
      );

      expect(result).toBe('Short prompt');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/compress-prompt',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            prompt: 'Long prompt text here',
            maxLength: 50
          })
        })
      );
    });

    it('should fallback to truncation on API failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Compression service unavailable')
      );

      const longPrompt = 'A'.repeat(100);
      const result = await SecureApiService.compressPromptIntelligently(longPrompt, 50);

      expect(result).toBe('A'.repeat(47) + '...');
      expect(result.length).toBeLessThanOrEqual(50);
    });
  });
});