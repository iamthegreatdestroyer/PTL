import { describe, it, expect } from 'vitest';
import {
  normalizeType,
  parseUnionType,
  isUnionType,
  isArrayType,
  getArrayElementType,
  isFunctionType,
  simplifyType,
} from '../../types/utils';

describe('Type Utilities', () => {
  describe('normalizeType', () => {
    it('should normalize whitespace', () => {
      expect(normalizeType('string  |  number')).toBe('string | number');
    });

    it('should preserve type structure', () => {
      expect(normalizeType('{ name: string }')).toBe('{ name: string }');
    });

    it('should handle array types', () => {
      expect(normalizeType('string[]')).toBe('string[]');
      expect(normalizeType('Array<string>')).toBe('string[]');
    });

    it('should handle nested types', () => {
      expect(normalizeType('Array<Array<number>>')).toBe('number[][]');
    });
  });

  describe('parseUnionType', () => {
    it('should parse simple union', () => {
      const result = parseUnionType('string | number');
      expect(result).toEqual(['string', 'number']);
    });

    it('should parse union with multiple types', () => {
      const result = parseUnionType('string | number | boolean | null');
      expect(result).toEqual(['string', 'number', 'boolean', 'null']);
    });

    it('should handle single type', () => {
      const result = parseUnionType('string');
      expect(result).toEqual(['string']);
    });

    it('should preserve complex types in union', () => {
      const result = parseUnionType('string[] | { name: string }');
      expect(result).toHaveLength(2);
      expect(result).toContain('string[]');
    });
  });

  describe('isUnionType', () => {
    it('should detect union types', () => {
      expect(isUnionType('string | number')).toBe(true);
      expect(isUnionType('string | number | boolean')).toBe(true);
    });

    it('should return false for non-union types', () => {
      expect(isUnionType('string')).toBe(false);
      expect(isUnionType('number[]')).toBe(false);
      expect(isUnionType('{ a: string }')).toBe(false);
    });

    it('should handle complex cases', () => {
      // Pipe in template literal should not count as union
      expect(isUnionType("'a' | 'b'")).toBe(true);
    });
  });

  describe('isArrayType', () => {
    it('should detect array syntax', () => {
      expect(isArrayType('string[]')).toBe(true);
      expect(isArrayType('number[]')).toBe(true);
    });

    it('should detect Array generic syntax', () => {
      expect(isArrayType('Array<string>')).toBe(true);
      expect(isArrayType('Array<number>')).toBe(true);
    });

    it('should return false for non-array types', () => {
      expect(isArrayType('string')).toBe(false);
      expect(isArrayType('object')).toBe(false);
    });
  });

  describe('getArrayElementType', () => {
    it('should extract element type from array syntax', () => {
      expect(getArrayElementType('string[]')).toBe('string');
      expect(getArrayElementType('number[]')).toBe('number');
    });

    it('should extract element type from Array generic', () => {
      expect(getArrayElementType('Array<string>')).toBe('string');
      expect(getArrayElementType('Array<{ id: number }>')).toBe('{ id: number }');
    });

    it('should handle nested arrays', () => {
      expect(getArrayElementType('string[][]')).toBe('string[]');
    });

    it('should return null for non-array types', () => {
      expect(getArrayElementType('string')).toBeNull();
    });
  });

  describe('isFunctionType', () => {
    it('should detect arrow function types', () => {
      expect(isFunctionType('() => void')).toBe(true);
      expect(isFunctionType('(x: number) => string')).toBe(true);
    });

    it('should detect Function type', () => {
      expect(isFunctionType('Function')).toBe(true);
    });

    it('should return false for non-function types', () => {
      expect(isFunctionType('string')).toBe(false);
      expect(isFunctionType('{ fn: () => void }')).toBe(false);
    });
  });

  describe('simplifyType', () => {
    it('should simplify redundant unions', () => {
      expect(simplifyType('string | string')).toBe('string');
    });

    it('should simplify never in union', () => {
      expect(simplifyType('string | never')).toBe('string');
    });

    it('should simplify to unknown when present', () => {
      expect(simplifyType('string | unknown')).toBe('unknown');
    });

    it('should sort union members', () => {
      expect(simplifyType('number | string | boolean')).toBe('boolean | number | string');
    });

    it('should preserve complex types', () => {
      const complex = '{ name: string } | { age: number }';
      const simplified = simplifyType(complex);
      expect(simplified).toContain('name');
      expect(simplified).toContain('age');
    });
  });
});
