import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PerformanceUtils } from '../performance';

describe('PerformanceUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    PerformanceUtils.clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Debounce', () => {
    it('should debounce function calls', async () => {
      const mockFn = vi.fn();
      const debouncedFn = PerformanceUtils.debounce(mockFn, 100);

      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      // Function should not be called immediately
      expect(mockFn).not.toHaveBeenCalled();

      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be called once with the last arguments
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });
  });

  describe('Throttle', () => {
    it('should throttle function calls', async () => {
      const mockFn = vi.fn();
      const throttledFn = PerformanceUtils.throttle(mockFn, 100);

      throttledFn('arg1');
      throttledFn('arg2');
      throttledFn('arg3');

      // First call should execute immediately
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');

      // Wait for throttle period
      await new Promise(resolve => setTimeout(resolve, 150));

      throttledFn('arg4');

      // Should execute again after throttle period
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('arg4');
    });
  });

  describe('Cache Management', () => {
    it('should set and get cached data', () => {
      const testData = { key: 'value', number: 42 };
      PerformanceUtils.setCache('test-key', testData, 5000);

      const retrieved = PerformanceUtils.getCache<typeof testData>('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent cache keys', () => {
      const result = PerformanceUtils.getCache('non-existent-key');
      expect(result).toBeNull();
    });

    it('should respect TTL and expire cache', () => {
      const originalNow = Date.now;
      let currentTime = 1000000;
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

      PerformanceUtils.setCache('expire-test', 'data', 1000);

      // Should be available immediately
      expect(PerformanceUtils.getCache('expire-test')).toBe('data');

      // Move time forward beyond TTL
      currentTime += 1001;

      // Should be expired and return null
      expect(PerformanceUtils.getCache('expire-test')).toBeNull();

      Date.now = originalNow;
    });

    it('should clear cache by pattern', () => {
      PerformanceUtils.setCache('user-123', 'user data');
      PerformanceUtils.setCache('user-456', 'user data 2');
      PerformanceUtils.setCache('session-abc', 'session data');

      PerformanceUtils.clearCache('user-.*');

      expect(PerformanceUtils.getCache('user-123')).toBeNull();
      expect(PerformanceUtils.getCache('user-456')).toBeNull();
      expect(PerformanceUtils.getCache('session-abc')).toBe('session data');
    });

    it('should clear all cache when no pattern provided', () => {
      PerformanceUtils.setCache('key1', 'value1');
      PerformanceUtils.setCache('key2', 'value2');

      PerformanceUtils.clearCache();

      expect(PerformanceUtils.getCache('key1')).toBeNull();
      expect(PerformanceUtils.getCache('key2')).toBeNull();
    });
  });

  describe('Image Optimization', () => {
    it('should return optimized image props with defaults', () => {
      const props = PerformanceUtils.getOptimizedImageProps(
        'https://example.com/image.jpg',
        'Test image'
      );

      expect(props).toEqual({
        src: 'https://example.com/image.jpg',
        alt: 'Test image',
        loading: 'lazy',
        decoding: 'async',
        sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
        style: {
          aspectRatio: 'auto',
          maxWidth: '100%',
          height: 'auto'
        }
      });
    });

    it('should apply custom optimization options', () => {
      const props = PerformanceUtils.getOptimizedImageProps(
        'https://example.com/image.jpg',
        'Test image',
        {
          lazy: false,
          quality: 95,
          format: 'png',
          sizes: '100vw'
        }
      );

      expect(props.loading).toBe('eager');
      expect(props.sizes).toBe('100vw');
    });
  });

  describe('Resource Preloading', () => {
    let mockCreateElement: any;
    let mockAppendChild: any;

    beforeEach(() => {
      const mockLink = {
        rel: '',
        href: '',
        as: '',
        crossOrigin: ''
      };

      mockCreateElement = vi.fn(() => mockLink);
      mockAppendChild = vi.fn();

      Object.defineProperty(document, 'createElement', {
        value: mockCreateElement,
        writable: true
      });

      Object.defineProperty(document.head, 'appendChild', {
        value: mockAppendChild,
        writable: true
      });
    });

    it('should preload font resources correctly', () => {
      PerformanceUtils.preloadCriticalResources(['font.woff2']);

      expect(mockCreateElement).toHaveBeenCalledWith('link');
      expect(mockAppendChild).toHaveBeenCalled();
    });

    it('should preload image resources correctly', () => {
      PerformanceUtils.preloadCriticalResources(['image.jpg']);

      expect(mockCreateElement).toHaveBeenCalledWith('link');
      expect(mockAppendChild).toHaveBeenCalled();
    });

    it('should preload CSS resources correctly', () => {
      PerformanceUtils.preloadCriticalResources(['styles.css']);

      expect(mockCreateElement).toHaveBeenCalledWith('link');
      expect(mockAppendChild).toHaveBeenCalled();
    });
  });

  describe('Module Loading', () => {
    it('should load module when condition is true', async () => {
      const mockModule = { default: { feature: 'loaded' } };
      const moduleLoader = vi.fn(() => Promise.resolve(mockModule));

      const result = await PerformanceUtils.loadModuleWhenNeeded(moduleLoader, true);

      expect(moduleLoader).toHaveBeenCalled();
      expect(result).toEqual({ feature: 'loaded' });
    });

    it('should not load module when condition is false', async () => {
      const moduleLoader = vi.fn();

      const result = await PerformanceUtils.loadModuleWhenNeeded(moduleLoader, false);

      expect(moduleLoader).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle module loading errors gracefully', async () => {
      const moduleLoader = vi.fn(() => Promise.reject(new Error('Load failed')));

      const result = await PerformanceUtils.loadModuleWhenNeeded(moduleLoader, true);

      expect(result).toBeNull();
    });
  });
});