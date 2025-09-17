import {
  AppError,
  APIError,
  ValidationError,
  AuthenticationError,
  NetworkError,
  AIServiceError,
  FileUploadError,
  ErrorHandler,
  ErrorReportingConfig
} from '../types';

export class ErrorHandlerService {
  private static instance: ErrorHandlerService;
  private handlers: ErrorHandler[] = [];
  private config: ErrorReportingConfig = {
    enableReporting: process.env.NODE_ENV === 'production',
    includeContext: true,
    includeStack: process.env.NODE_ENV === 'development'
  };

  private constructor() {
    this.setupDefaultHandlers();
  }

  static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }

  private setupDefaultHandlers(): void {
    // Console error handler for development
    this.addHandler({
      canHandle: () => process.env.NODE_ENV === 'development',
      handle: (error: AppError) => {
        console.group(`🚨 ${error.name}`);
        console.error(`Code: ${error.code}`);
        console.error(`Message: ${error.message}`);
        console.error(`Severity: ${error.severity}`);
        console.error(`Category: ${error.category}`);
        if (error.context) {
          console.error('Context:', error.context);
        }
        if (error.stack) {
          console.error('Stack:', error.stack);
        }
        console.groupEnd();
      }
    });

    // Toast notification handler for user-facing errors
    this.addHandler({
      canHandle: (error: Error) =>
        error instanceof ValidationError ||
        error instanceof AuthenticationError ||
        error instanceof FileUploadError,
      handle: (error: AppError) => {
        // This would integrate with your toast system
        // For now, we'll just log it
        console.warn(`User Error: ${error.message}`);
      }
    });

    // Network error handler
    this.addHandler({
      canHandle: (error: Error) => error instanceof NetworkError,
      handle: (error: NetworkError) => {
        console.error(`Network Error: ${error.message}`, {
          statusCode: error.statusCode,
          endpoint: error.endpoint
        });
      }
    });

    // AI Service error handler
    this.addHandler({
      canHandle: (error: Error) => error instanceof AIServiceError,
      handle: (error: AIServiceError) => {
        console.error(`AI Service Error: ${error.message}`, {
          model: error.model,
          promptLength: error.promptLength
        });
      }
    });
  }

  addHandler(handler: ErrorHandler): void {
    this.handlers.push(handler);
  }

  handle(error: Error | AppError): void {
    let appError: AppError;

    // Convert generic errors to AppError
    if (error instanceof APIError) {
      appError = error;
    } else {
      appError = this.convertToAppError(error);
    }

    // Find and execute appropriate handlers
    const applicableHandlers = this.handlers.filter(handler =>
      handler.canHandle(error)
    );

    if (applicableHandlers.length === 0) {
      // Default fallback handler
      console.error('Unhandled error:', error);
      return;
    }

    applicableHandlers.forEach(handler => {
      try {
        handler.handle(appError);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    });

    // Report to external service if configured
    if (this.config.enableReporting && appError.severity === 'critical') {
      this.reportError(appError);
    }
  }

  private convertToAppError(error: Error): AppError {
    // Check for specific error patterns and convert accordingly
    if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
      return new AuthenticationError(error.message);
    }

    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return new ValidationError(error.message);
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new NetworkError(error.message);
    }

    if (error.message.includes('upload') || error.message.includes('file')) {
      return new FileUploadError(error.message);
    }

    // Default to generic API error
    return new APIError('UNKNOWN_ERROR', error.message, 'medium', 'system', {
      originalError: error.name,
      stack: error.stack
    });
  }

  private async reportError(error: AppError): Promise<void> {
    if (!this.config.endpoint) {
      return;
    }

    try {
      const payload = {
        code: error.code,
        message: error.message,
        severity: error.severity,
        category: error.category,
        timestamp: error.timestamp,
        context: this.config.includeContext ? error.context : undefined,
        stack: this.config.includeStack ? error.stack : undefined,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(payload)
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  configure(config: Partial<ErrorReportingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Utility methods for creating specific errors
  static createValidationError(field: string, value: unknown, message: string): ValidationError {
    return new ValidationError(message, field, value);
  }

  static createAuthError(message?: string): AuthenticationError {
    return new AuthenticationError(message);
  }

  static createNetworkError(message: string, statusCode?: number, endpoint?: string): NetworkError {
    return new NetworkError(message, statusCode, endpoint);
  }

  static createAIServiceError(message: string, model?: string, promptLength?: number): AIServiceError {
    return new AIServiceError(message, model, promptLength);
  }

  static createFileUploadError(
    message: string,
    fileName?: string,
    fileSize?: number,
    fileType?: string
  ): FileUploadError {
    return new FileUploadError(message, fileName, fileSize, fileType);
  }
}

// Global error handler instance
export const errorHandler = ErrorHandlerService.getInstance();

// Global error event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorHandler.handle(event.error || new Error(event.message));
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handle(new Error(event.reason?.message || 'Unhandled promise rejection'));
  });
}

// Helper function for async error handling
export const handleAsyncError = <T>(
  operation: () => Promise<T>
): Promise<T | null> => {
  return operation().catch((error) => {
    errorHandler.handle(error);
    return null;
  });
};

// Helper function for sync error handling
export const handleSyncError = <T>(
  operation: () => T
): T | null => {
  try {
    return operation();
  } catch (error) {
    errorHandler.handle(error as Error);
    return null;
  }
};