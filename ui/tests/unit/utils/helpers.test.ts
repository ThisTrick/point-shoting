/**
 * @jest-environment jsdom
 */

import {
  generateId,
  debounce,
  throttle,
  deepClone,
  deepMerge,
  capitalize,
  camelToTitle,
  truncate,
  formatFileSize,
  formatDuration,
  unique,
  groupBy,
  sortBy,
  chunk
} from '../../../src/utils/helpers';

describe('Helpers - ID Generation', () => {
  it('generates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(id1.length).toBeGreaterThan(0);
  });
});

describe('Helpers - Debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('delays function execution', () => {
    const func = jest.fn();
    const debounced = debounce(func, 100);

    debounced();
    expect(func).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('cancels previous calls', () => {
    const func = jest.fn();
    const debounced = debounce(func, 100);

    debounced();
    debounced();
    debounced();

    jest.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(1);
  });
});

describe('Helpers - Throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('limits function execution rate', () => {
    const func = jest.fn();
    const throttled = throttle(func, 100);

    throttled();
    throttled();
    throttled();

    expect(func).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    throttled();
    expect(func).toHaveBeenCalledTimes(2);
  });
});

describe('Helpers - Deep Clone', () => {
  it('clones primitive values', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(null)).toBe(null);
  });

  it('clones arrays', () => {
    const arr = [1, 2, 3];
    const cloned = deepClone(arr);
    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
  });

  it('clones nested objects', () => {
    const obj = { a: { b: { c: 1 } } };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.a).not.toBe(obj.a);
  });

  it('clones dates', () => {
    const date = new Date();
    const cloned = deepClone(date);
    expect(cloned.getTime()).toBe(date.getTime());
    expect(cloned).not.toBe(date);
  });
});

describe('Helpers - Deep Merge', () => {
  it('merges two objects', () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('merges nested objects', () => {
    const target = { a: { x: 1, y: 2 } };
    const source: Partial<typeof target> = { a: { x: 1, y: 3 } };
    const result = deepMerge(target, source);
    expect(result.a.x).toBe(1);
    expect(result.a.y).toBe(3);
  });
});

describe('Helpers - String Utilities', () => {
  it('capitalizes strings', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('HELLO')).toBe('HELLO');
    expect(capitalize('')).toBe('');
  });

  it('converts camelCase to Title Case', () => {
    expect(camelToTitle('helloWorld')).toBe('Hello World');
    expect(camelToTitle('myVariableName')).toBe('My Variable Name');
  });

  it('truncates long strings', () => {
    expect(truncate('hello world', 5)).toBe('he...');
    expect(truncate('hi', 10)).toBe('hi');
  });
});

describe('Helpers - Formatting', () => {
  it('formats file sizes', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toMatch(/1(\.\d+)?\s*KB/);
    expect(formatFileSize(1024 * 1024)).toMatch(/1(\.\d+)?\s*MB/);
  });

  it('formats durations', () => {
    expect(formatDuration(0)).toContain('0');
    expect(formatDuration(1000)).toContain('1');
    expect(formatDuration(60000)).toContain('1');
  });
});

describe('Helpers - Array Utilities', () => {
  it('returns unique values', () => {
    expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    expect(unique(['a', 'b', 'a'])).toEqual(['a', 'b']);
  });

  it('groups by key', () => {
    const items = [
      { type: 'a', value: 1 },
      { type: 'b', value: 2 },
      { type: 'a', value: 3 }
    ];
    const grouped = groupBy(items, item => item.type);
    expect(grouped.a).toHaveLength(2);
    expect(grouped.b).toHaveLength(1);
  });

  it('sorts arrays', () => {
    const items = [{ value: 3 }, { value: 1 }, { value: 2 }];
    const sorted = sortBy(items, item => item.value);
    expect(sorted[0]?.value).toBe(1);
    expect(sorted[2]?.value).toBe(3);
  });

  it('chunks arrays', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 2)).toEqual([]);
  });
});
