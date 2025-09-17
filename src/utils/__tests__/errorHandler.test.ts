import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandlerService, handleAsyncError, handleSyncError } from '../errorHandler';
import {
  APIError,
  ValidationError,
  AuthenticationError,
  NetworkError,
  AIServiceError,
  FileUploadError
} from '../../types';

describe('ErrorHandlerService', () => {
  let errorHandler: ErrorHandlerService;

  beforeEach(() => {
    vi.clearAllMocks();
    errorHandler = ErrorHandlerService.getInstance();

    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error Classification', () => {
    it('should handle API errors correctly', () => {
      const apiError = new APIError('TEST_ERROR', 'Test message', 'high', 'system');

      errorHandler.handle(apiError);

      expect(console.group).toHaveBeenCalledWith('🚨 APIError');
      expect(console.error).toHaveBeenCalledWith('Code: TEST_ERROR');
      expect(console.error).toHaveBeenCalledWith('Message: Test message');
    });

    it('should convert generic errors to APIError', () => {
      const genericError = new Error('Generic error message');

      errorHandler.handle(genericError);

      expect(console.error).toHaveBeenCalledWith('Code: UNKNOWN_ERROR');
      expect(console.error).toHaveBeenCalledWith('Message: Generic error message');
    });

    it('should handle validation errors as user-facing errors', () => {
      const validationError = new ValidationError('Invalid field', 'email', 'invalid-email');

      errorHandler.handle(validationError);

      expect(console.warn).toHaveBeenCalledWith('User Error: Invalid field');
    });

    it('should handle authentication errors', () => {
      const authError = new AuthenticationError('User not authenticated');

      errorHandler.handle(authError);

      expect(console.warn).toHaveBeenCalledWith('User Error: User not authenticated');
    });

    it('should handle network errors with context', () => {
      const networkError = new NetworkError('Connection failed', 500, '/api/users');

      errorHandler.handle(networkError);

      expect(console.error).toHaveBeenCalledWith('Network Error: Connection failed', {
        statusCode: 500,
        endpoint: '/api/users'
      });
    });

    it('should handle AI service errors with model context', () => {
      const aiError = new AIServiceError('Generation failed', 'gpt-4', 1500);

      errorHandler.handle(aiError);

      expect(console.error).toHaveBeenCalledWith('AI Service Error: Generation failed', {
        model: 'gpt-4',
        promptLength: 1500
      });
    });
  });

  describe('Error Pattern Recognition', () => {
    it('should detect authentication errors from message content', () => {
      const error = new Error('Authentication failed - please login');

      errorHandler.handle(error);

      expect(console.error).toHaveBeenCalledWith('Code: AUTH_ERROR');
    });

    it('should detect validation errors from message content', () => {
      const error = new Error('Validation failed: invalid email format');

      errorHandler.handle(error);

      expect(console.error).toHaveBeenCalledWith('Code: VALIDATION_ERROR');
    });

    it('should detect network errors from message content', () => {
      const error = new Error('Network error: fetch failed');

      errorHandler.handle(error);

      expect(console.error).toHaveBeenCalledWith('Code: NETWORK_ERROR');
    });

    it('should detect file upload errors from message content', () => {
      const error = new Error('File upload failed: size too large');

      errorHandler.handle(error);

      expect(console.error).toHaveBeenCalledWith('Code: FILE_UPLOAD_ERROR');
    });
  });

  describe('Static Factory Methods', () => {
    it('should create validation error with field context', () => {
      const error = ErrorHandlerService.createValidationError('email', 'test@', 'Invalid email format');

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe('email');
      expect(error.value).toBe('test@');
      expect(error.message).toBe('Invalid email format');
    });

    it('should create authentication error', () => {
      const error = ErrorHandlerService.createAuthError('Session expired');

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Session expired');
    });

    it('should create network error with status code', () => {
      const error = ErrorHandlerService.createNetworkError('API unavailable', 503, '/api/health');

      expect(error).toBeInstanceOf(NetworkError);
      expect(error.statusCode).toBe(503);
      expect(error.endpoint).toBe('/api/health');
    });

    it('should create AI service error with model info', () => {
      const error = ErrorHandlerService.createAIServiceError('Rate limit exceeded', 'dall-e-3', 2000);

      expect(error).toBeInstanceOf(AIServiceError);
      expect(error.model).toBe('dall-e-3');
      expect(error.promptLength).toBe(2000);
    });

    it('should create file upload error with file details', () => {
      const error = ErrorHandlerService.createFileUploadError(
        'File too large',
        'image.jpg',
        5000000,
        'image/jpeg'
      );

      expect(error).toBeInstanceOf(FileUploadError);
      expect(error.fileName).toBe('image.jpg');
      expect(error.fileSize).toBe(5000000);
      expect(error.fileType).toBe('image/jpeg');
    });
  });

  describe('Custom Error Handlers', () => {
    it('should allow adding custom error handlers', () => {
      const customHandler = {
        canHandle: (error: Error) => error.message.includes('custom'),
        handle: vi.fn()
      };

      errorHandler.addHandler(customHandler);

      const customError = new Error('This is a custom error');
      errorHandler.handle(customError);

      expect(customHandler.handle).toHaveBeenCalled();
    });

    it('should handle errors with multiple applicable handlers', () => {
      const handler1 = {
        canHandle: () => true,
        handle: vi.fn()
      };

      const handler2 = {
        canHandle: () => true,
        handle: vi.fn()
      };

      errorHandler.addHandler(handler1);
      errorHandler.addHandler(handler2);

      const error = new Error('Test error');
      errorHandler.handle(error);

      expect(handler1.handle).toHaveBeenCalled();
      expect(handler2.handle).toHaveBeenCalled();
    });
  });

  describe('Configuration', () => {
    it('should allow configuration updates', () => {
      errorHandler.configure({
        enableReporting: true,
        endpoint: 'https://api.example.com/errors',
        includeContext: false
      });

      // This test verifies the configuration is accepted without error
      expect(true).toBe(true);
    });
  });
});

describe('Helper Functions', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('handleAsyncError', () => {
    it('should return result when operation succeeds', async () => {
      const operation = () => Promise.resolve('success');

      const result = await handleAsyncError(operation);

      expect(result).toBe('success');
    });

    it('should return null when operation fails', async () => {
      const operation = () => Promise.reject(new Error('Async error'));

      const result = await handleAsyncError(operation);

      expect(result).toBeNull();
    });
  });

  describe('handleSyncError', () => {
    it('should return result when operation succeeds', () => {
      const operation = () => 'success';

      const result = handleSyncError(operation);

      expect(result).toBe('success');
    });

    it('should return null when operation fails', () => {
      const operation = () => {
        throw new Error('Sync error');
      };

      const result = handleSyncError(operation);

      expect(result).toBeNull();
    });
  });
});