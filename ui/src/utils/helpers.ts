/**
 * Utility Helper Functions
 * 
 * General-purpose utility functions used throughout the Point Shooting UI application.
 */

import { ErrorInfo, ErrorSeverity, ErrorCategory } from '../types';

// ============================================================================
// GENERAL UTILITIES
// ============================================================================

/**
 * Generates a unique ID string
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

/**
 * Creates a debounced version of a function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

/**
 * Creates a throttled version of a function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>): void => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Deep clones an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {} as { [key: string]: unknown };
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone((obj as { [key: string]: unknown })[key]);
      }
    }
    return clonedObj as T;
  }
  
  return obj;
}

/**
 * Deep merges two objects
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (sourceValue && typeof sourceValue === 'object' && 
          targetValue && typeof targetValue === 'object' &&
          !Array.isArray(sourceValue) && !Array.isArray(targetValue)) {
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        ) as T[Extract<keyof T, string>];
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }
  
  return result;
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts camelCase to title case
 */
export function camelToTitle(str: string): string {
  if (!str) return str;
  
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, char => char.toUpperCase())
    .trim();
}

/**
 * Truncates text to specified length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Formats file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Formats duration in human readable format
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Formats timestamp to readable date string
 */
export function formatTimestamp(timestamp: number, includeTime = true): string {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
  }
  
  return date.toLocaleDateString(undefined, options);
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Removes duplicates from array
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Groups array items by a key function
 */
export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  
  for (const item of array) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }
  
  return result;
}

/**
 * Sorts array by multiple criteria
 */
export function sortBy<T>(
  array: T[],
  ...selectors: Array<(item: T) => string | number>
): T[] {
  return [...array].sort((a, b) => {
    for (const selector of selectors) {
      const aVal = selector(a);
      const bVal = selector(b);
      
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  });
}

/**
 * Chunks array into smaller arrays of specified size
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Creates a standardized error info object
 */
export function createError(
  code: string,
  message: string,
  category: ErrorCategory,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  details?: string,
  context?: Record<string, unknown>
): ErrorInfo {
  return {
    code,
    message,
    details,
    timestamp: Date.now(),
    severity,
    category,
    recoverable: severity !== ErrorSeverity.CRITICAL,
    context
  };
}

/**
 * Wraps a function to catch and standardize errors
 */
export function withErrorHandling<T extends (...args: unknown[]) => unknown>(
  fn: T,
  category: ErrorCategory,
  context?: Record<string, unknown>
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error: Error) => {
          throw createError(
            error.name || 'UnknownError',
            error.message || 'An unknown error occurred',
            category,
            ErrorSeverity.ERROR,
            error.stack,
            context
          );
        });
      }
      
      return result;
    } catch (error: unknown) {
      const err = error as Error;
      throw createError(
        err.name || 'UnknownError',
        err.message || 'An unknown error occurred',
        category,
        ErrorSeverity.ERROR,
        err.stack,
        context
      );
    }
  }) as T;
}

/**
 * Safely executes a function and returns result or error
 */
export async function safeExecute<T>(
  fn: () => Promise<T> | T
): Promise<{ success: true; data: T } | { success: false; error: ErrorInfo }> {
  try {
    const result = await fn();
    return { success: true, data: result };
  } catch (error: unknown) {
    const err = error as Error;
    return {
      success: false,
      error: createError(
        err.name || 'ExecutionError',
        err.message || 'Execution failed',
        ErrorCategory.SYSTEM,
        ErrorSeverity.ERROR,
        err.stack
      )
    };
  }
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Measures execution time of a function
 */
export async function measureTime<T>(
  fn: () => Promise<T> | T,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  if (label) {
    console.log(`${label}: ${duration.toFixed(2)}ms`);
  }
  
  return { result, duration };
}

/**
 * Creates a performance monitor for tracking operations
 */
export function createPerformanceMonitor() {
  const measurements: Record<string, number[]> = {};
  
  return {
    start(name: string): () => number {
      const startTime = performance.now();
      return () => {
        const duration = performance.now() - startTime;
        if (!measurements[name]) {
          measurements[name] = [];
        }
        measurements[name].push(duration);
        return duration;
      };
    },
    
    getStats(name: string) {
      const times = measurements[name] || [];
      if (times.length === 0) return null;
      
      const sum = times.reduce((a, b) => a + b, 0);
      const avg = sum / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      
      return { count: times.length, avg, min, max, total: sum };
    },
    
    clear(name?: string) {
      if (name) {
        delete measurements[name];
      } else {
        Object.keys(measurements).forEach(key => delete measurements[key]);
      }
    }
  };
}

// ============================================================================
// DOM UTILITIES
// ============================================================================

/**
 * Safely queries DOM element
 */
export function querySelector<T extends Element = Element>(
  selector: string,
  parent?: Element | Document
): T | null {
  try {
    return (parent || document).querySelector<T>(selector);
  } catch {
    return null;
  }
}

/**
 * Safely queries DOM elements
 */
export function querySelectorAll<T extends Element = Element>(
  selector: string,
  parent?: Element | Document
): T[] {
  try {
    return Array.from((parent || document).querySelectorAll<T>(selector));
  } catch {
    return [];
  }
}

/**
 * Checks if element is visible in viewport
 */
export function isElementInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Smoothly scrolls element into view
 */
export function scrollIntoView(
  element: Element,
  options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'center' }
): void {
  if ('scrollIntoView' in element) {
    element.scrollIntoView(options);
  }
}

// ============================================================================
// LOCAL STORAGE UTILITIES
// ============================================================================

/**
 * Safely gets item from localStorage
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely sets item in localStorage
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely removes item from localStorage
 */
export function removeStorageItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears all localStorage items with optional prefix filter
 */
export function clearStorage(prefix?: string): void {
  try {
    if (prefix) {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(prefix));
      keys.forEach(key => localStorage.removeItem(key));
    } else {
      localStorage.clear();
    }
  } catch {
    // Ignore storage errors
  }
}
