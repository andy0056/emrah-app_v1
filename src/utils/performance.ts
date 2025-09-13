import type { ImageOptimization } from '../types';

/**
 * Performance optimization utilities
 */
export class PerformanceUtils {
  private static cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

  /**
   * Debounce function calls
   */
  static debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function calls
   */
  static throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Memory-based cache with TTL
   */
  static setCache<T>(key: string, data: T, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  static getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  static clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Optimize image loading
   */
  static getOptimizedImageProps(
    src: string,
    alt: string,
    options: Partial<ImageOptimization> = {}
  ) {
    const defaults: ImageOptimization = {
      lazy: true,
      quality: 85,
      format: 'webp',
      sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
    };

    const config = { ...defaults, ...options };

    return {
      src,
      alt,
      loading: config.lazy ? 'lazy' : 'eager',
      decoding: 'async',
      sizes: config.sizes,
      style: {
        aspectRatio: 'auto',
        maxWidth: '100%',
        height: 'auto'
      }
    };
  }

  /**
   * Lazy load images with intersection observer
   */
  static lazyLoadImages(): void {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');
            observer.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  /**
   * Preload critical resources
   */
  static preloadCriticalResources(resources: string[]): void {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      if (resource.match(/\.(woff2?|eot|ttf|otf)$/)) {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      } else if (resource.match(/\.(jpg|jpeg|png|webp|gif|svg)$/)) {
        link.as = 'image';
      } else if (resource.match(/\.css$/)) {
        link.as = 'style';
      } else if (resource.match(/\.js$/)) {
        link.as = 'script';
      } else {
        // Default fallback for unknown resource types
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
    });
  }

  /**
   * Monitor and report performance metrics
   */
  static reportWebVitals(): void {
    // Core Web Vitals monitoring
    if ('web-vital' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log);
        getFID(console.log);
        getFCP(console.log);
        getLCP(console.log);
        getTTFB(console.log);
      }).catch(() => {
        // Gracefully handle if web-vitals is not available
      });
    }
  }

  /**
   * Optimize bundle size by checking if modules are loaded
   */
  static async loadModuleWhenNeeded<T>(
    moduleLoader: () => Promise<{ default: T }>,
    condition: boolean = true
  ): Promise<T | null> {
    if (!condition) {
      return null;
    }

    try {
      const module = await moduleLoader();
      return module.default;
    } catch (error) {
      console.error('Failed to load module:', error);
      return null;
    }
  }

  /**
   * Virtual scrolling for large lists
   */
  static createVirtualScroller<T>(
    container: HTMLElement,
    items: T[],
    itemHeight: number,
    renderItem: (item: T, index: number) => HTMLElement
  ): { update: () => void } {
    let startIndex = 0;
    let endIndex = Math.min(items.length, Math.ceil(container.clientHeight / itemHeight) + 1);

    const update = () => {
      const scrollTop = container.scrollTop;
      startIndex = Math.floor(scrollTop / itemHeight);
      endIndex = Math.min(items.length, startIndex + Math.ceil(container.clientHeight / itemHeight) + 1);

      // Clear container
      container.innerHTML = '';

      // Create spacer for items before visible area
      if (startIndex > 0) {
        const topSpacer = document.createElement('div');
        topSpacer.style.height = `${startIndex * itemHeight}px`;
        container.appendChild(topSpacer);
      }

      // Render visible items
      for (let i = startIndex; i < endIndex; i++) {
        const element = renderItem(items[i], i);
        container.appendChild(element);
      }

      // Create spacer for items after visible area
      if (endIndex < items.length) {
        const bottomSpacer = document.createElement('div');
        bottomSpacer.style.height = `${(items.length - endIndex) * itemHeight}px`;
        container.appendChild(bottomSpacer);
      }
    };

    container.addEventListener('scroll', PerformanceUtils.throttle(update, 16));
    update(); // Initial render

    return { update };
  }
}
