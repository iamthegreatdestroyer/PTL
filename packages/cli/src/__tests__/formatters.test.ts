import { describe, it, expect } from 'vitest';
import { formatConfidence, formatType, formatEvidence } from '../formatters';

describe('CLI Formatters', () => {
  describe('formatConfidence', () => {
    it('should format high confidence with green color indicator', () => {
      const result = formatConfidence(0.95);
      expect(result).toContain('95');
      expect(result.level).toBe('high');
    });

    it('should format medium confidence with yellow color indicator', () => {
      const result = formatConfidence(0.7);
      expect(result).toContain('70');
      expect(result.level).toBe('medium');
    });

    it('should format low confidence with red color indicator', () => {
      const result = formatConfidence(0.3);
      expect(result).toContain('30');
      expect(result.level).toBe('low');
    });

    it('should handle edge case of 0%', () => {
      const result = formatConfidence(0);
      expect(result).toContain('0');
    });

    it('should handle edge case of 100%', () => {
      const result = formatConfidence(1);
      expect(result).toContain('100');
    });
  });

  describe('formatType', () => {
    it('should format primitive types', () => {
      expect(formatType('string')).toBe('string');
      expect(formatType('number')).toBe('number');
      expect(formatType('boolean')).toBe('boolean');
    });

    it('should format array types', () => {
      expect(formatType('string[]')).toBe('string[]');
      expect(formatType('Array<number>')).toContain('number');
    });

    it('should format union types', () => {
      const result = formatType('string | number');
      expect(result).toContain('string');
      expect(result).toContain('number');
    });

    it('should format object types', () => {
      const result = formatType('{ name: string; age: number }');
      expect(result).toContain('name');
      expect(result).toContain('string');
    });

    it('should truncate long types', () => {
      const longType = '{ a: string; b: string; c: string; d: string; e: string }';
      const result = formatType(longType, { maxLength: 30 });
      expect(result.length).toBeLessThanOrEqual(33); // 30 + "..."
    });
  });

  describe('formatEvidence', () => {
    it('should format single evidence', () => {
      const evidence = [{ type: 'literal_value', confidence: 0.95, source: 'parser' }];

      const result = formatEvidence(evidence);
      expect(result).toContain('literal_value');
      expect(result).toContain('95');
    });

    it('should format multiple evidence sources', () => {
      const evidence = [
        { type: 'literal_value', confidence: 0.95, source: 'parser' },
        { type: 'naming_convention', confidence: 0.8, source: 'prior' },
      ];

      const result = formatEvidence(evidence);
      expect(result).toContain('literal_value');
      expect(result).toContain('naming_convention');
    });

    it('should sort evidence by confidence', () => {
      const evidence = [
        { type: 'low', confidence: 0.5, source: 'test' },
        { type: 'high', confidence: 0.95, source: 'test' },
        { type: 'medium', confidence: 0.75, source: 'test' },
      ];

      const result = formatEvidence(evidence, { sort: 'confidence' });
      const highIndex = result.indexOf('high');
      const lowIndex = result.indexOf('low');
      expect(highIndex).toBeLessThan(lowIndex);
    });

    it('should handle empty evidence', () => {
      const result = formatEvidence([]);
      expect(result).toContain('No evidence');
    });
  });
});
