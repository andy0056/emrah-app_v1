/**
 * Image Generation Error Boundary
 * Specialized error handling for image generation components
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Image, AlertTriangle, RefreshCw, Settings } from 'lucide-react';

interface Props {
  children: ReactNode;
  onError?: (error: Error) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorType: 'generation' | 'api' | 'validation' | 'unknown';
}

export class ImageGenerationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorType: 'unknown'
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorType = ImageGenerationErrorBoundary.categorizeError(error);

    return {
      hasError: true,
      error,
      errorType
    };
  }

  static categorizeError(error: Error): State['errorType'] {
    const message = error.message.toLowerCase();

    if (message.includes('api') || message.includes('fetch') || message.includes('network')) {
      return 'api';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    if (message.includes('generation') || message.includes('image') || message.includes('fal')) {
      return 'generation';
    }
    return 'unknown';
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Image Generation Error:', error, errorInfo);

    this.props.onError?.(error);

    // Log specific metrics for image generation errors
    this.logImageGenerationError(error, errorInfo);
  }

  private logImageGenerationError = (error: Error, errorInfo: ErrorInfo) => {
    const imageErrorData = {
      type: 'image_generation_error',
      errorCategory: this.state.errorType,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      // Could include generation parameters if available
    };

    console.log('Image Generation Error Data:', imageErrorData);
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorType: 'unknown'
    });

    this.props.onRetry?.();
  };

  private getErrorMessage = (): { title: string; description: string; suggestions: string[] } => {
    const { errorType, error } = this.state;

    switch (errorType) {
      case 'api':
        return {
          title: 'Connection Error',
          description: 'Unable to connect to the image generation service.',
          suggestions: [
            'Check your internet connection',
            'Try again in a few moments',
            'Contact support if the problem persists'
          ]
        };

      case 'validation':
        return {
          title: 'Input Validation Error',
          description: 'There was an issue with your input parameters.',
          suggestions: [
            'Check that all required fields are filled',
            'Ensure image dimensions are valid',
            'Verify brand assets are accessible'
          ]
        };

      case 'generation':
        return {
          title: 'Generation Failed',
          description: 'The AI service encountered an issue during image generation.',
          suggestions: [
            'Try simplifying your prompt',
            'Reduce the number of images requested',
            'Check brand asset compatibility'
          ]
        };

      default:
        return {
          title: 'Unexpected Error',
          description: error?.message || 'An unexpected error occurred during image generation.',
          suggestions: [
            'Refresh the page and try again',
            'Clear your browser cache',
            'Contact support with error details'
          ]
        };
    }
  };

  render() {
    if (this.state.hasError) {
      const { title, description, suggestions } = this.getErrorMessage();

      return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 my-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
                <Image className="w-6 h-6 text-orange-600" />
              </div>
            </div>

            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-orange-900 mb-1">
                {title}
              </h3>

              <p className="text-orange-700 mb-4">
                {description}
              </p>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-orange-900 mb-2">
                  Suggested Solutions:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>

              {/* Development error details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-4 bg-orange-100 rounded p-3">
                  <summary className="cursor-pointer text-sm font-medium text-orange-900">
                    Technical Details
                  </summary>
                  <pre className="mt-2 text-xs text-orange-800 overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ImageGenerationErrorBoundary;