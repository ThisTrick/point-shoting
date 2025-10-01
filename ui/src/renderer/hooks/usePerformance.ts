/**
 * Performance Optimization Hook
 * 
 * Comprehensive React performance optimization utilities including:
 * - Component memoization helpers
 * - Lazy loading components
 * - Bundle splitting utilities
 * - Performance monitoring
 * - Memory leak detection
 * - Render optimization strategies
 * - Virtual scrolling helpers
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

interface PerformanceMetrics {
  renderCount: number;
  renderTime: number;
  memoryUsage: number;
  componentMounted: number;
  lastRenderTimestamp: number;
}

interface UsePerformanceOptions {
  trackRenders?: boolean;
  trackMemory?: boolean;
  enableProfiling?: boolean;
  debugMode?: boolean;
  componentName?: string;
}

export const usePerformance = (options: UsePerformanceOptions = {}) => {
  const {
    trackRenders = true,
    trackMemory = process.env.NODE_ENV === 'development',
    enableProfiling = process.env.NODE_ENV === 'development',
    debugMode = process.env.NODE_ENV === 'development',
    componentName = 'Unknown',
  } = options;

  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    renderTime: 0,
    memoryUsage: 0,
    componentMounted: Date.now(),
    lastRenderTimestamp: 0,
  });

  const renderStartRef = useRef<number>(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics>(metricsRef.current);

  // Track component renders
  useEffect(() => {
    if (!trackRenders) return;

    const startTime = performance.now();
    renderStartRef.current = startTime;

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      metricsRef.current.renderCount += 1;
      metricsRef.current.renderTime += renderTime;
      metricsRef.current.lastRenderTimestamp = endTime;

      if (debugMode && renderTime > 16) { // > 1 frame at 60fps
        console.warn(
          `🐌 Slow render in ${componentName}: ${renderTime.toFixed(2)}ms (render #${metricsRef.current.renderCount})`
        );
      }

      setMetrics({ ...metricsRef.current });
    };
  });

  // Track memory usage
  useEffect(() => {
    if (!trackMemory) return;

    const updateMemory = () => {
      if ('memory' in performance && (performance as any).memory) {
        const memInfo = (performance as any).memory;
        metricsRef.current.memoryUsage = memInfo.usedJSHeapSize;
        setMetrics({ ...metricsRef.current });
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [trackMemory]);

  // Performance profiling
  const startProfiler = useCallback(() => {
    if (!enableProfiling) return;
    
    if ('mark' in performance) {
      performance.mark(`${componentName}-start`);
    }
  }, [enableProfiling, componentName]);

  const endProfiler = useCallback((operation: string) => {
    if (!enableProfiling) return;

    if ('mark' in performance && 'measure' in performance) {
      const endMark = `${componentName}-${operation}-end`;
      performance.mark(endMark);
      
      try {
        performance.measure(
          `${componentName}-${operation}`,
          `${componentName}-start`,
          endMark
        );
      } catch (error) {
        // Mark doesn't exist, ignore
      }
    }
  }, [enableProfiling, componentName]);

  // Optimized callback creator
  const createStableCallback = useCallback(
    (callback: Function, deps: any[]) => {
      return useCallback(callback as any, deps);
    },
    []
  );

  // Optimized memo creator
  const createStableMemo = useCallback(
    (factory: () => any, deps: any[]) => {
      return useMemo(factory, deps);
    },
    []
  );

  // Memory leak detection
  useEffect(() => {
    if (!debugMode) return;

    const checkMemoryLeaks = () => {
      const currentTime = Date.now();
      const componentAge = currentTime - metricsRef.current.componentMounted;
      
      // Warn if component has been mounted for a long time with many renders
      if (componentAge > 300000 && metricsRef.current.renderCount > 1000) { // 5 minutes and 1000+ renders
        console.warn(
          `🚨 Potential memory leak in ${componentName}: ` +
          `${metricsRef.current.renderCount} renders in ${(componentAge / 1000).toFixed(1)}s`
        );
      }
    };

    const leakCheckInterval = setInterval(checkMemoryLeaks, 60000); // Every minute

    return () => clearInterval(leakCheckInterval);
  }, [debugMode, componentName]);

  return {
    metrics,
    startProfiler,
    endProfiler,
    createStableCallback,
    createStableMemo,
  };
};

// Note: createLazyComponent has been moved to useLazyComponent.tsx
// to avoid JSX/TypeScript generic conflicts in .ts files
export { createLazyComponent } from './useLazyComponent';

/**
 * Debounced value hook for performance optimization
 */
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Throttled callback hook
 */
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      } else {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - (now - lastRun.current));
      }
    }) as T,
    [callback, delay]
  );
};

/**
 * Virtual scrolling hook for large lists
 */
export const useVirtualScroll = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight,
    }));
  }, [items, startIndex, endIndex, itemHeight]);

  const onScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    totalHeight,
    visibleItems,
    onScroll,
    startIndex,
    endIndex,
  };
};

/**
 * Intersection Observer hook for lazy loading
 */
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry?.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (isVisible && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasIntersected, options]);

  return {
    elementRef,
    isIntersecting,
    hasIntersected,
  };
};

/**
 * Memoization helper with custom equality
 */
export const useDeepMemo = <T>(
  factory: () => T,
  deps: any[],
  compare?: (a: any[], b: any[]) => boolean
): T => {
  const ref = useRef<{ deps: any[]; value: T }>();

  const defaultCompare = (a: any[], b: any[]) => {
    if (a.length !== b.length) return false;
    return a.every((item, index) => {
      if (typeof item === 'object' && item !== null && typeof b[index] === 'object' && b[index] !== null) {
        return JSON.stringify(item) === JSON.stringify(b[index]);
      }
      return item === b[index];
    });
  };

  const isEqual = compare ? compare : defaultCompare;

  if (!ref.current || !isEqual(ref.current.deps, deps)) {
    ref.current = {
      deps: [...deps],
      value: factory(),
    };
  }

  return ref.current.value;
};

/**
 * Bundle splitting utilities
 */
export const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);
    
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    
    document.head.appendChild(script);
  });
};

export const preloadComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): Promise<{ default: T }> => {
  return importFunc();
};

// Performance monitoring utilities
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 ${name}: ${(end - start).toFixed(2)}ms`);
  }
  
  return end - start;
};

export const measureAsyncPerformance = async <T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 ${name}: ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
};
