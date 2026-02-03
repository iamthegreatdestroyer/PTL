import { describe, it, expect } from 'vitest';
import {
  hashString,
  debounce,
  throttle,
  deepMerge,
  pick,
  omit,
  clamp,
  retry,
} from '../../utils/helpers';

describe('Utility Helpers', () => {
  describe('hashString', () => {
    it('should return consistent hash for same input', () => {
      const hash1 = hashString('test');
      const hash2 = hashString('test');
      expect(hash1).toBe(hash2);
    });

    it('should return different hash for different input', () => {
      const hash1 = hashString('test1');
      const hash2 = hashString('test2');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', () => {
      const hash = hashString('');
      expect(typeof hash).toBe('string');
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0;
      const fn = debounce(() => callCount++, 50);

      fn();
      fn();
      fn();

      expect(callCount).toBe(0);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(callCount).toBe(1);
    });

    it('should pass arguments to debounced function', async () => {
      let result: number = 0;
      const fn = debounce((x: number) => {
        result = x;
      }, 50);

      fn(42);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result).toBe(42);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      let callCount = 0;
      const fn = throttle(() => callCount++, 50);

      fn();
      fn();
      fn();

      expect(callCount).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 60));

      fn();
      expect(callCount).toBe(2);
    });
  });

  describe('deepMerge', () => {
    it('should merge nested objects', () => {
      const a = { x: { y: 1 }, z: 2 };
      const b = { x: { w: 3 } };

      const result = deepMerge(a, b);

      expect(result.x.y).toBe(1);
      expect(result.x.w).toBe(3);
      expect(result.z).toBe(2);
    });

    it('should override primitives', () => {
      const a = { x: 1 };
      const b = { x: 2 };

      const result = deepMerge(a, b);

      expect(result.x).toBe(2);
    });

    it('should not mutate original objects', () => {
      const a = { x: 1 };
      const b = { y: 2 };

      deepMerge(a, b);

      expect(a).toEqual({ x: 1 });
      expect(b).toEqual({ y: 2 });
    });

    it('should handle arrays', () => {
      const a = { arr: [1, 2] };
      const b = { arr: [3, 4] };

      const result = deepMerge(a, b);

      expect(result.arr).toEqual([3, 4]);
    });
  });

  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };

      const result = pick(obj, ['a', 'c']);

      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('should handle missing keys', () => {
      const obj = { a: 1, b: 2 };

      const result = pick(obj, ['a', 'c'] as any);

      expect(result).toEqual({ a: 1 });
    });
  });

  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };

      const result = omit(obj, ['b']);

      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('should handle empty omit list', () => {
      const obj = { a: 1, b: 2 };

      const result = omit(obj, []);

      expect(result).toEqual({ a: 1, b: 2 });
    });
  });

  describe('clamp', () => {
    it('should clamp value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('retry', () => {
    it('should return result on success', async () => {
      const fn = async () => 42;

      const result = await retry(fn, { maxAttempts: 3 });

      expect(result).toBe(42);
    });

    it('should retry on failure', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Not yet');
        }
        return 'success';
      };

      const result = await retry(fn, { maxAttempts: 3, delay: 10 });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max attempts', async () => {
      const fn = async () => {
        throw new Error('Always fails');
      };

      await expect(retry(fn, { maxAttempts: 3, delay: 10 })).rejects.toThrow('Always fails');
    });
  });
});
