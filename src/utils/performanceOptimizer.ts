/**
 * Performance Optimization Utilities
 * Prevents duplicate calculations and improves efficiency
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class PerformanceOptimizer {
  private static cache = new Map<string, CacheEntry<any>>();
  private static computationLocks = new Map<string, Promise<any>>();

  /**
   * Memoize expensive calculations
   */
  static memoize<T>(
    key: string,
    compute: () => Promise<T>,
    ttl: number = 60000 // 1 minute default
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`📊 Cache hit for: ${key}`);
      return Promise.resolve(cached.data);
    }

    // Check if computation is already in progress
    const existingLock = this.computationLocks.get(key);
    if (existingLock) {
      console.log(`⏳ Waiting for existing computation: ${key}`);
      return existingLock;
    }

    // Start new computation with lock
    console.log(`🔄 Computing: ${key}`);
    const computationPromise = compute().then(result => {
      this.cache.set(key, {
        data: result,
        timestamp: Date.now(),
        ttl
      });
      this.computationLocks.delete(key);
      return result;
    }).catch(error => {
      this.computationLocks.delete(key);
      throw error;
    });

    this.computationLocks.set(key, computationPromise);
    return computationPromise;
  }

  /**
   * Debounce function calls
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number = 300
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * Throttle function calls
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number = 1000
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Clear cache
   */
  static clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
    console.log(`🧹 Cache cleared${pattern ? ` for pattern: ${pattern}` : ''}`);
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number;
    entries: string[];
    totalMemory: number;
  } {
    const entries = Array.from(this.cache.keys());
    const totalMemory = entries.reduce((sum, key) => {
      const entry = this.cache.get(key);
      return sum + JSON.stringify(entry).length;
    }, 0);

    return {
      size: this.cache.size,
      entries,
      totalMemory
    };
  }
}

export { PerformanceOptimizer };
