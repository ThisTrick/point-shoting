/**
 * @jest-environment jsdom
 */

import {
  isNotNull,
  isNonEmptyString,
  isNumberInRange,
  isValidEnumValue,
  matchesPattern,
  isValidFilePath,
  isSupportedFileFormat,
  isValidFileSize
} from '../../../src/utils/validation';

describe('Validation - Basic Type Checks', () => {
  it('checks for non-null values', () => {
    expect(isNotNull(42)).toBe(true);
    expect(isNotNull('hello')).toBe(true);
    expect(isNotNull(null)).toBe(false);
    expect(isNotNull(undefined)).toBe(false);
  });

  it('checks for non-empty strings', () => {
    expect(isNonEmptyString('hello')).toBe(true);
    expect(isNonEmptyString('')).toBe(false);
    expect(isNonEmptyString('   ')).toBe(false);
    expect(isNonEmptyString(42)).toBe(false);
  });
});

describe('Validation - Number Range', () => {
  it('validates numbers in range', () => {
    expect(isNumberInRange(5, 0, 10)).toBe(true);
    expect(isNumberInRange(0, 0, 10)).toBe(true);
    expect(isNumberInRange(10, 0, 10)).toBe(true);
    expect(isNumberInRange(-1, 0, 10)).toBe(false);
    expect(isNumberInRange(11, 0, 10)).toBe(false);
  });

  it('handles edge cases', () => {
    expect(isNumberInRange(NaN, 0, 10)).toBe(false);
    expect(isNumberInRange(Infinity, 0, 10)).toBe(false);
  });
});

describe('Validation - Enum Values', () => {
  enum TestEnum {
    A = 'a',
    B = 'b',
    C = 'c'
  }

  it('validates enum values', () => {
    expect(isValidEnumValue('a', TestEnum)).toBe(true);
    expect(isValidEnumValue('b', TestEnum)).toBe(true);
    expect(isValidEnumValue('d', TestEnum)).toBe(false);
    expect(isValidEnumValue(42, TestEnum)).toBe(false);
  });
});

describe('Validation - Pattern Matching', () => {
  it('matches regex patterns', () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(matchesPattern('user@example.com', emailPattern)).toBe(true);
    expect(matchesPattern('invalid-email', emailPattern)).toBe(false);
    expect(matchesPattern(42, emailPattern)).toBe(false);
  });
});

describe('Validation - File Operations', () => {
  it('validates file paths', () => {
    expect(isValidFilePath('/path/to/file.jpg')).toBe(true);
    expect(isValidFilePath('C:\\path\\to\\file.jpg')).toBe(true);
    expect(isValidFilePath('')).toBe(false);
    expect(isValidFilePath(null)).toBe(false);
  });

  it('validates supported file formats', () => {
    expect(isSupportedFileFormat('image.jpg')).toBe(true);
    expect(isSupportedFileFormat('image.png')).toBe(true);
    expect(isSupportedFileFormat('image.gif')).toBe(true);
    expect(isSupportedFileFormat('document.pdf')).toBe(false);
  });

  it('validates file sizes', () => {
    expect(isValidFileSize(1024)).toBe(true);
    expect(isValidFileSize(1024 * 1024 * 50)).toBe(true);
    expect(isValidFileSize(1024 * 1024 * 150)).toBe(false);
    expect(isValidFileSize(-1)).toBe(false);
    expect(isValidFileSize('1024')).toBe(false);
  });
});
