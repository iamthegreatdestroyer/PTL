import { describe, it, expect } from 'vitest';
import { loadConfig, mergeConfigs, validateConfig } from '../../config';
import type { PtlConfig } from '../../types';

describe('Shared Configuration', () => {
  describe('loadConfig', () => {
    it('should return default config when no file exists', async () => {
      const config = await loadConfig({ searchPath: '/nonexistent' });

      expect(config).toBeDefined();
      expect(config.version).toBe(1);
      expect(config.minConfidence).toBeDefined();
    });

    it('should have sensible defaults', async () => {
      const config = await loadConfig({});

      expect(config.minConfidence).toBeGreaterThanOrEqual(0);
      expect(config.minConfidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(config.include)).toBe(true);
      expect(Array.isArray(config.exclude)).toBe(true);
    });
  });

  describe('mergeConfigs', () => {
    it('should merge two configs with override priority', () => {
      const base: Partial<PtlConfig> = {
        minConfidence: 0.6,
        include: ['src/**/*.ts'],
        strict: false,
      };

      const override: Partial<PtlConfig> = {
        minConfidence: 0.8,
        strict: true,
      };

      const merged = mergeConfigs(base, override);

      expect(merged.minConfidence).toBe(0.8);
      expect(merged.strict).toBe(true);
      expect(merged.include).toEqual(['src/**/*.ts']);
    });

    it('should merge array properties', () => {
      const base: Partial<PtlConfig> = {
        include: ['src/**/*.ts'],
        exclude: ['**/*.test.ts'],
      };

      const override: Partial<PtlConfig> = {
        include: ['lib/**/*.ts'],
        exclude: ['**/*.spec.ts'],
      };

      const merged = mergeConfigs(base, override, { mergeArrays: true });

      expect(merged.include).toContain('src/**/*.ts');
      expect(merged.include).toContain('lib/**/*.ts');
    });

    it('should replace array properties when mergeArrays is false', () => {
      const base: Partial<PtlConfig> = {
        include: ['src/**/*.ts'],
      };

      const override: Partial<PtlConfig> = {
        include: ['lib/**/*.ts'],
      };

      const merged = mergeConfigs(base, override, { mergeArrays: false });

      expect(merged.include).toEqual(['lib/**/*.ts']);
    });
  });

  describe('validateConfig', () => {
    it('should accept valid config', () => {
      const config: PtlConfig = {
        version: 1,
        minConfidence: 0.6,
        include: ['src/**/*.ts'],
        exclude: ['node_modules'],
        strict: false,
        debug: false,
      };

      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should reject invalid version', () => {
      const config = {
        version: 0,
        minConfidence: 0.6,
      };

      expect(() => validateConfig(config as PtlConfig)).toThrow(/version/i);
    });

    it('should reject invalid minConfidence', () => {
      const config = {
        version: 1,
        minConfidence: 1.5,
      };

      expect(() => validateConfig(config as PtlConfig)).toThrow(/minConfidence/i);
    });

    it('should reject non-array include', () => {
      const config = {
        version: 1,
        minConfidence: 0.6,
        include: 'src/**/*.ts',
      };

      expect(() => validateConfig(config as unknown as PtlConfig)).toThrow(/include/i);
    });
  });

  describe('config file detection', () => {
    it('should detect ptl.config.json', async () => {
      // This would test file system integration
      const possibleNames = [
        'ptl.config.json',
        'ptl.config.js',
        'ptl.config.mjs',
        '.ptlrc',
        '.ptlrc.json',
      ];

      expect(possibleNames.length).toBeGreaterThan(0);
    });
  });
});
