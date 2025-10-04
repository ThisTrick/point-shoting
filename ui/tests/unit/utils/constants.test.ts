/**
 * @jest-environment jsdom
 */

import {
  APP_INFO,
  FILE_CONSTRAINTS,
  ANIMATION_LIMITS,
  UI_CONSTRAINTS,
  VALIDATION_PATTERNS,
  DEFAULT_UI_SETTINGS
} from '../../../src/utils/constants';

describe('Constants - APP_INFO', () => {
  it('has required application metadata', () => {
    expect(APP_INFO.NAME).toBe('Point Shooting');
    expect(APP_INFO.VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(APP_INFO.DESCRIPTION).toContain('Particle animation');
    expect(APP_INFO.AUTHOR).toBeDefined();
  });
});

describe('Constants - FILE_CONSTRAINTS', () => {
  it('has reasonable file size limit', () => {
    expect(FILE_CONSTRAINTS.MAX_FILE_SIZE).toBe(100 * 1024 * 1024);
  });

  it('supports common image formats', () => {
    const formats = FILE_CONSTRAINTS.SUPPORTED_FORMATS;
    expect(formats).toContain('.jpg');
    expect(formats).toContain('.png');
    expect(formats).toContain('.gif');
  });
});

describe('Constants - ANIMATION_LIMITS', () => {
  it('has valid particle count ranges', () => {
    const densities = Object.values(ANIMATION_LIMITS.PARTICLE_COUNT);
    densities.forEach(d => {
      expect(d.min).toBeGreaterThan(0);
      expect(d.max).toBeGreaterThan(d.min);
      expect(d.default).toBeGreaterThanOrEqual(d.min);
      expect(d.default).toBeLessThanOrEqual(d.max);
    });
  });

  it('has valid speed multipliers', () => {
    const multipliers = Object.values(ANIMATION_LIMITS.SPEED_MULTIPLIERS);
    multipliers.forEach(m => expect(m).toBeGreaterThan(0));
  });

  it('has valid FPS targets', () => {
    expect(ANIMATION_LIMITS.TARGET_FPS).toBe(60);
    expect(ANIMATION_LIMITS.MIN_FPS).toBe(30);
  });
});

describe('Constants - UI_CONSTRAINTS', () => {
  it('has valid window dimensions', () => {
    expect(UI_CONSTRAINTS.WINDOW.MIN_WIDTH).toBeGreaterThan(0);
    expect(UI_CONSTRAINTS.WINDOW.DEFAULT_WIDTH).toBeGreaterThan(UI_CONSTRAINTS.WINDOW.MIN_WIDTH);
  });

  it('has animation timing values', () => {
    expect(UI_CONSTRAINTS.ANIMATIONS.FAST).toBeGreaterThan(0);
    expect(UI_CONSTRAINTS.ANIMATIONS.NORMAL).toBeGreaterThan(0);
  });
});

describe('Constants - VALIDATION_PATTERNS', () => {
  it('has valid regex patterns', () => {
    expect(VALIDATION_PATTERNS.HEX_COLOR).toBeInstanceOf(RegExp);
    expect(VALIDATION_PATTERNS.VERSION).toBeInstanceOf(RegExp);
  });

  it('validates HEX colors correctly', () => {
    expect(VALIDATION_PATTERNS.HEX_COLOR.test('#fff')).toBe(true);
    expect(VALIDATION_PATTERNS.HEX_COLOR.test('#123456')).toBe(true);
  });
});

describe('Constants - DEFAULT_UI_SETTINGS', () => {
  it('has required properties', () => {
    expect(DEFAULT_UI_SETTINGS.theme).toBeDefined();
    expect(DEFAULT_UI_SETTINGS.language).toBeDefined();
  });
});
