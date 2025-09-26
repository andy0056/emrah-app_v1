/**
 * Form Error Boundary
 * Specialized error handling for form components
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FileText, AlertTriangle, RefreshCw, Save } from 'lucide-react';

interface Props {
  children: ReactNode;
  onError?: (error: Error) => void;
  formData?: any; // Current form state to preserve
}

interface State {
  hasError: boolean;
  error?: Error;
  preservedFormData?: any;
}

export class FormErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Form Error Boundary caught an error:', error, errorInfo);

    // Preserve form data when error occurs
    this.setState({
      preservedFormData: this.props.formData
    });

    this.props.onError?.(error);

    // Log form-specific error data
    this.logFormError(error, errorInfo);
  }

  private logFormError = (error: Error, errorInfo: ErrorInfo) => {
    const formErrorData = {
      type: 'form_error',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      formDataPreserved: !!this.state.preservedFormData,
      timestamp: new Date().toISOString()
    };

    console.log('Form Error Data:', formErrorData);
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined
    });
  };

  private handleSaveFormData = () => {
    if (this.state.preservedFormData) {
      const dataStr = JSON.stringify(this.state.preservedFormData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `form-backup-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Form data has been saved to your downloads folder.');
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, preservedFormData } = this.state;

      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 my-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
            </div>

            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-1">
                Form Error Occurred
              </h3>

              <p className="text-yellow-700 mb-4">
                There was an issue with the form processing. Your data has been preserved and can be recovered.
              </p>

              {preservedFormData && (
                <div className="bg-yellow-100 rounded-md p-3 mb-4">
                  <div className="flex items-center">
                    <Save className="w-4 h-4 text-yellow-600 mr-2" />
                    <span className="text-sm font-medium text-yellow-800">
                      Form data preserved
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Your form inputs have been automatically saved and can be downloaded or restored.
                  </p>
                </div>
              )}

              {/* Development error details */}
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mb-4 bg-yellow-100 rounded p-3">
                  <summary className="cursor-pointer text-sm font-medium text-yellow-900">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs text-yellow-800 overflow-auto">
                    {error.stack}
                  </pre>
                </details>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>

                {preservedFormData && (
                  <button
                    onClick={this.handleSaveFormData}
                    className="inline-flex items-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Download Form Data
                  </button>
                )}

                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Refresh Page
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-yellow-200">
                <p className="text-xs text-yellow-600">
                  <strong>Data Recovery:</strong> If the problem persists, you can use the downloaded form data
                  to restore your inputs by uploading the JSON file when the form is working again.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FormErrorBoundary;