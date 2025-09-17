/**
 * Production monitoring and error tracking utilities
 */
export class MonitoringService {
  private static readonly ERROR_ENDPOINT = '/api/errors';
  private static readonly METRICS_ENDPOINT = '/api/metrics';
  private static readonly MAX_ERROR_QUEUE = 10;
  
  private static errorQueue: any[] = [];
  private static isInitialized = false;

  /**
   * Initialize monitoring service
   */
  static initialize(): void {
    if (this.isInitialized) return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        type: 'javascript',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        type: 'promise',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // Performance monitoring
    this.initializePerformanceMonitoring();

    // Periodic flush of error queue
    setInterval(() => this.flushErrorQueue(), 30000);

    this.isInitialized = true;
  }

  /**
   * Log application error
   */
  static logError(error: {
    message: string;
    stack?: string;
    type?: string;
    component?: string;
    props?: any;
    userId?: string;
    [key: string]: any;
  }): void {
    const errorLog = {
      ...error,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId()
    };

    // Add to queue
    this.errorQueue.push(errorLog);

    // Prevent queue overflow
    if (this.errorQueue.length > this.MAX_ERROR_QUEUE) {
      this.errorQueue.shift();
    }

    // Immediate flush for critical errors
    if (error.type === 'critical') {
      this.flushErrorQueue();
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('MonitoringService:', errorLog);
    }
  }

  /**
   * Log performance metrics
   */
  static logMetric(name: string, value: number, unit: string = 'ms', tags: Record<string, string> = {}): void {
    const metric = {
      name,
      value,
      unit,
      tags,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId()
    };

    // Send metric (could be queued similar to errors)
    this.sendMetric(metric);
  }

  /**
   * Track user action
   */
  static trackAction(action: string, data: Record<string, any> = {}): void {
    const actionLog = {
      action,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      sessionId: this.getSessionId()
    };

    // Could send to analytics service
    if (process.env.NODE_ENV === 'development') {
      console.log('Action tracked:', actionLog);
    }
  }

  /**
   * Initialize performance monitoring
   */
  private static initializePerformanceMonitoring(): void {
    // Core Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.logMetric('lcp', entry.startTime, 'ms', { type: 'core-vitals' });
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = entry.processingStart - entry.startTime;
          this.logMetric('fid', fid, 'ms', { type: 'core-vitals' });
        }
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let cls = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            cls += (entry as any).value;
          }
        }
        this.logMetric('cls', cls, 'score', { type: 'core-vitals' });
      }).observe({ entryTypes: ['layout-shift'] });
    }

    // Custom performance marks
    if (performance.mark) {
      // App initialization
      performance.mark('app-init-start');
      
      window.addEventListener('load', () => {
        performance.mark('app-init-end');
        performance.measure('app-initialization', 'app-init-start', 'app-init-end');
        
        const measure = performance.getEntriesByName('app-initialization')[0];
        this.logMetric('app-init-time', measure.duration, 'ms', { type: 'custom' });
      });
    }
  }

  /**
   * Flush error queue to server
   */
  private static async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    // Only attempt to send errors in development or if backend is available
    if (process.env.NODE_ENV === 'development') {
      try {
        await fetch(this.ERROR_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ errors })
        });
      } catch (_error) {
        // If sending fails, add errors back to queue
        this.errorQueue.unshift(...errors.slice(-5)); // Keep only last 5
      }
    }
  }

  /**
   * Send metric to server
   */
  private static async sendMetric(metric: any): Promise<void> {
    // Metrics disabled in production - no backend endpoint available
    if (process.env.NODE_ENV === 'development') {
      try {
        await fetch(this.METRICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metric)
        });
      } catch (_error) {
        // Silently fail for metrics
      }
    }
  }

  /**
   * Get or create session ID
   */
  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem('monitoring_session_id');
    
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('monitoring_session_id', sessionId);
    }
    
    return sessionId;
  }

  /**
   * Set user context
   */
  static setUserContext(userId: string, userData: Record<string, any> = {}): void {
    sessionStorage.setItem('monitoring_user_id', userId);
    sessionStorage.setItem('monitoring_user_data', JSON.stringify(userData));
  }

  /**
   * Clear user context
   */
  static clearUserContext(): void {
    sessionStorage.removeItem('monitoring_user_id');
    sessionStorage.removeItem('monitoring_user_data');
  }

  /**
   * Create error boundary
   */
  static createErrorBoundary(componentName: string) {
    return (error: Error, errorInfo: any) => {
      this.logError({
        message: error.message,
        stack: error.stack,
        type: 'react',
        component: componentName,
        errorInfo,
        props: errorInfo.componentStack
      });
    };
  }
}

// React Error Boundary HOC
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return class ErrorBoundary extends React.Component<P, { hasError: boolean }> {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error: Error) {
      return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: any) {
      MonitoringService.createErrorBoundary(componentName)(error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
            <p className="text-red-600 text-sm">
              An error occurred in the {componentName} component. Please refresh the page or try again later.
            </p>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
}