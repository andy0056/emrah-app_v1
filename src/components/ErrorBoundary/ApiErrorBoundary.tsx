/**
 * API Error Boundary
 * Specialized error boundary for API-related errors
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isNetworkError: boolean;
  retryCount: number;
}

export class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isNetworkError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isNetworkError = ApiErrorBoundary.isNetworkError(error);

    return {
      hasError: true,
      error,
      isNetworkError
    };
  }

  static isNetworkError(error: Error): boolean {
    const networkErrorPatterns = [
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      'fetch',
      'NETWORK_ERROR',
      'CONNECTION_ERROR',
      'TIMEOUT',
      'net::ERR_',
      'API request failed'
    ];

    return networkErrorPatterns.some(pattern =>
      error.message.includes(pattern) || error.name.includes(pattern)
    );
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('API Error Boundary caught an error:', error, errorInfo);

    this.props.onError?.(error, errorInfo);

    this.setState({
      error,
      isNetworkError: ApiErrorBoundary.isNetworkError(error)
    });

    // Log API errors differently
    this.logApiError(error, errorInfo);
  }

  private logApiError = (error: Error, errorInfo: ErrorInfo) => {
    const apiErrorData = {
      type: 'api_error',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      isNetworkError: this.state.isNetworkError,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount
    };

    console.log('API Error data:', apiErrorData);
    // TODO: Send to monitoring service
  };

  private handleRetry = async () => {
    // Check network connectivity first
    if (this.state.isNetworkError) {
      const isOnline = await this.checkNetworkConnectivity();
      if (!isOnline) {
        alert('Please check your internet connection and try again.');
        return;
      }
    }

    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  private checkNetworkConnectivity = async (): Promise<boolean> => {
    try {
      const response = await fetch('/health', { method: 'HEAD' });
      return response.ok;
    } catch {
      return navigator.onLine;
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      const { error, isNetworkError, retryCount } = this.state;

      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              {isNetworkError ? (
                <WifiOff className="h-5 w-5 text-red-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {isNetworkError ? 'Connection Error' : 'API Error'}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {isNetworkError
                    ? 'Unable to connect to the server. Please check your internet connection.'
                    : 'There was a problem processing your request.'
                  }
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">
                      Error Details
                    </summary>
                    <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
                      {error.message}
                      {error.stack && '\n\n' + error.stack}
                    </pre>
                  </details>
                )}
              </div>
              <div className="mt-4">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={this.handleRetry}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Try Again
                  </button>
                  {retryCount > 0 && (
                    <span className="inline-flex items-center px-2 py-1 text-xs text-red-600 bg-red-50 rounded">
                      Attempt {retryCount + 1}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for API error handling
export function useApiErrorHandler() {
  const handleApiError = React.useCallback((error: Error) => {
    console.error('API Error caught by hook:', error);

    // You can dispatch to a global error state here
    // or trigger notifications

    return {
      isNetworkError: ApiErrorBoundary.isNetworkError(error),
      message: error.message,
      canRetry: true
    };
  }, []);

  return { handleApiError };
}

export default ApiErrorBoundary;