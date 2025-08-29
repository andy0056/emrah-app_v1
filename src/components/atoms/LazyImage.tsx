import React, { useState, useRef, useEffect } from 'react';
import { PerformanceUtils } from '../../utils/performance';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  quality?: number;
  aspectRatio?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallback,
  quality = 85,
  aspectRatio,
  className = '',
  style = {},
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const currentImg = imgRef.current;
    
    if (!currentImg) return;

    // Create intersection observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.unobserve(currentImg);
        }
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );

    observerRef.current.observe(currentImg);

    return () => {
      if (observerRef.current && currentImg) {
        observerRef.current.unobserve(currentImg);
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    setIsError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    setIsLoaded(false);
    onError?.();
  };

  const imageProps = PerformanceUtils.getOptimizedImageProps(src, alt, {
    lazy: true,
    quality,
    format: 'webp'
  });

  const containerStyle = {
    ...style,
    ...(aspectRatio && { aspectRatio }),
    position: 'relative' as const,
    overflow: 'hidden' as const,
    backgroundColor: '#f3f4f6'
  };

  return (
    <div 
      ref={imgRef}
      className={`${className} transition-opacity duration-300`}
      style={containerStyle}
    >
      {/* Loading placeholder */}
      {!isLoaded && !isError && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Blur placeholder before loading */}
      {!isInView && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      )}

      {/* Error fallback */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {fallback ? (
            <img
              src={fallback}
              alt={alt}
              className="w-full h-full object-cover opacity-50"
              onError={() => setIsError(true)}
            />
          ) : (
            <div className="text-gray-400 text-center p-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <p className="text-sm">Failed to load image</p>
            </div>
          )}
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <img
          {...imageProps}
          {...props}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            ...imageProps.style
          }}
        />
      )}
    </div>
  );
};

export default LazyImage;