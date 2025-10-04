/**
 * Lazy Component Loading Utilities
 * 
 * Helper for lazy loading React components with error boundaries
 */

import React, { useState, useCallback } from 'react';

/**
 * Lazy loading helper with error boundaries
 */
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType,
  errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>
) => {
  const LazyComponent = React.lazy(async () => {
    try {
      return await importFunc();
    } catch (error) {
      console.error('Lazy component loading failed:', error);
      throw error;
    }
  });

  return React.memo((props: React.ComponentProps<T>) => {
    const [error, setError] = useState<Error | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const retry = useCallback(() => {
      setError(null);
      setRetryCount(prev => prev + 1);
    }, []);

    if (error && errorBoundary) {
      const ErrorBoundaryComponent = errorBoundary;
      return <ErrorBoundaryComponent error={error} retry={retry} />;
    }

    const FallbackComponent = fallback || (() => <div>Loading...</div>);

    return (
      <React.Suspense fallback={<FallbackComponent />}>
        <LazyComponent key={retryCount} {...(props as any)} />
      </React.Suspense>
    );
  });
};
