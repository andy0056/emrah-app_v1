/**
 * Performance Monitoring Service
 * Comprehensive performance tracking and analytics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface UserTiming {
  name: string;
  startTime: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface ErrorReport {
  message: string;
  stack?: string;
  component?: string;
  userId?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private timings: Map<string, UserTiming> = new Map();
  private isEnabled: boolean = true;
  private maxMetrics: number = 1000;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.setupPerformanceObserver();
    this.setupAutoFlush();
    this.trackPageLoad();
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (enabled) {
      this.setupAutoFlush();
    } else {
      this.clearAutoFlush();
    }
  }

  /**
   * Track a custom performance metric
   */
  trackMetric(name: string, value: number, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);
    this.enforceMetricsLimit();

    // Log significant metrics
    if (value > 1000 || name.includes('error') || name.includes('critical')) {
      console.warn(`⚠️ Performance Alert: ${name} = ${value}ms`, metadata);
    }
  }

  /**
   * Start timing a user operation
   */
  startTiming(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const timing: UserTiming = {
      name,
      startTime: performance.now(),
      metadata
    };

    this.timings.set(name, timing);
  }

  /**
   * End timing a user operation
   */
  endTiming(name: string, metadata?: Record<string, any>): number {
    if (!this.isEnabled) return 0;

    const timing = this.timings.get(name);
    if (!timing) {
      console.warn(`⚠️ No timing started for: ${name}`);
      return 0;
    }

    const duration = performance.now() - timing.startTime;
    timing.duration = duration;

    // Merge metadata
    const combinedMetadata = { ...timing.metadata, ...metadata };

    this.trackMetric(`timing.${name}`, duration, combinedMetadata);
    this.timings.delete(name);

    return duration;
  }

  /**
   * Track React component render performance
   */
  trackComponentRender(componentName: string, renderTime: number, props?: any): void {
    this.trackMetric(`component.${componentName}.render`, renderTime, {
      component: componentName,
      propsCount: props ? Object.keys(props).length : 0,
      timestamp: Date.now()
    });
  }

  /**
   * Track API request performance
   */
  trackApiRequest(endpoint: string, method: string, duration: number, status: number): void {
    const metadata = {
      endpoint,
      method,
      status,
      success: status >= 200 && status < 400
    };

    this.trackMetric(`api.request`, duration, metadata);

    // Track endpoint-specific metrics
    this.trackMetric(`api.${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`, duration, metadata);

    // Alert on slow API calls
    if (duration > 5000) {
      console.warn(`🐌 Slow API Request: ${method} ${endpoint} took ${duration}ms`);
    }
  }

  /**
   * Track error occurrences
   */
  trackError(error: Error, component?: string, metadata?: Record<string, any>): void {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      component,
      timestamp: Date.now(),
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...metadata
      }
    };

    // Track error as metric
    this.trackMetric('error.occurred', 1, errorReport);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error tracked:', errorReport);
    }
  }

  /**
   * Track user interactions
   */
  trackUserInteraction(action: string, element?: string, metadata?: Record<string, any>): void {
    this.trackMetric(`interaction.${action}`, 1, {
      element,
      timestamp: Date.now(),
      ...metadata
    });
  }

  /**
   * Track bundle size and asset loading
   */
  trackAssetLoading(): void {
    if (typeof window === 'undefined') return;

    // Track bundle size (approximate)
    const scripts = document.querySelectorAll('script[src]');
    let totalScriptSize = 0;

    scripts.forEach(script => {
      // This is an approximation - actual bundle analysis would need webpack-bundle-analyzer
      const src = script.getAttribute('src');
      if (src && src.includes('assets')) {
        totalScriptSize += 100; // Placeholder - real implementation would track actual sizes
      }
    });

    this.trackMetric('bundle.estimated_size', totalScriptSize);

    // Track asset loading performance
    if ('performance' in window) {
      const entries = performance.getEntriesByType('resource');
      entries.forEach(entry => {
        if (entry.name.includes('assets') || entry.name.includes('chunk')) {
          this.trackMetric('asset.load_time', entry.duration, {
            asset: entry.name,
            size: entry.transferSize
          });
        }
      });
    }
  }

  /**
   * Track Core Web Vitals
   */
  trackCoreWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Track Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        this.trackMetric('core_web_vitals.lcp', entry.startTime, {
          element: entry.element?.tagName
        });
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Track First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        this.trackMetric('core_web_vitals.fid', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Track Cumulative Layout Shift (CLS)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          this.trackMetric('core_web_vitals.cls', entry.value);
        }
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    metrics: PerformanceMetric[];
    summary: Record<string, { avg: number; max: number; count: number }>;
    issues: string[];
  } {
    const summary: Record<string, { avg: number; max: number; count: number }> = {};
    const issues: string[] = [];

    // Group metrics by name and calculate statistics
    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = { avg: 0, max: 0, count: 0 };
      }

      const stat = summary[metric.name];
      stat.count++;
      stat.max = Math.max(stat.max, metric.value);
      stat.avg = ((stat.avg * (stat.count - 1)) + metric.value) / stat.count;
    });

    // Identify performance issues
    Object.entries(summary).forEach(([name, stat]) => {
      if (name.includes('api') && stat.avg > 2000) {
        issues.push(`Slow API calls: ${name} averages ${stat.avg.toFixed(0)}ms`);
      }
      if (name.includes('component') && stat.avg > 100) {
        issues.push(`Slow component renders: ${name} averages ${stat.avg.toFixed(0)}ms`);
      }
      if (name.includes('error') && stat.count > 10) {
        issues.push(`High error rate: ${name} occurred ${stat.count} times`);
      }
    });

    return {
      metrics: [...this.metrics],
      summary,
      issues
    };
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      performance: this.getPerformanceSummary()
    }, null, 2);
  }

  /**
   * Clear all collected metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.timings.clear();
  }

  // Private methods

  private setupPerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      // Observe navigation timing
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.trackMetric('navigation.dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
            this.trackMetric('navigation.load_event', navEntry.loadEventEnd - navEntry.loadEventStart);
            this.trackMetric('navigation.total_page_load', navEntry.loadEventEnd - navEntry.fetchStart);
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      console.warn('Performance Observer setup failed:', error);
    }
  }

  private trackPageLoad(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      // Track page load timing
      const timing = performance.timing;
      this.trackMetric('page.load_time', timing.loadEventEnd - timing.navigationStart);
      this.trackMetric('page.dom_ready', timing.domContentLoadedEventEnd - timing.navigationStart);

      // Track asset loading
      setTimeout(() => this.trackAssetLoading(), 1000);

      // Track Core Web Vitals
      this.trackCoreWebVitals();
    });
  }

  private enforceMetricsLimit(): void {
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics * 0.8); // Keep 80% of metrics
    }
  }

  private setupAutoFlush(): void {
    this.clearAutoFlush();
    this.flushTimer = setInterval(() => {
      this.flushMetrics();
    }, this.flushInterval);
  }

  private clearAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  private async flushMetrics(): void {
    if (this.metrics.length === 0) return;

    try {
      // In a real implementation, you would send metrics to your analytics service
      const summary = this.getPerformanceSummary();
      console.log('📊 Performance Metrics Summary:', {
        totalMetrics: summary.metrics.length,
        issues: summary.issues,
        topMetrics: Object.entries(summary.summary)
          .sort(([,a], [,b]) => b.avg - a.avg)
          .slice(0, 5)
      });

      // TODO: Send to external monitoring service (Sentry, DataDog, etc.)
      // await this.sendToMonitoringService(summary);

    } catch (error) {
      console.error('Failed to flush performance metrics:', error);
    }
  }
}

// Singleton instance
export const performanceMonitoring = new PerformanceMonitoringService();

// React hook for component performance tracking
export function usePerformanceTracking(componentName: string) {
  const trackRender = (renderTime: number, props?: any) => {
    performanceMonitoring.trackComponentRender(componentName, renderTime, props);
  };

  const trackInteraction = (action: string, metadata?: Record<string, any>) => {
    performanceMonitoring.trackUserInteraction(action, componentName, metadata);
  };

  return { trackRender, trackInteraction };
}

// Higher-order component for automatic performance tracking
export function withPerformanceTracking<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  componentName?: string
) {
  return function PerformanceTrackedComponent(props: T) {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name;
    const startTime = performance.now();

    React.useEffect(() => {
      const renderTime = performance.now() - startTime;
      performanceMonitoring.trackComponentRender(name, renderTime, props);
    });

    return <WrappedComponent {...props} />;
  };
}

export default performanceMonitoring;