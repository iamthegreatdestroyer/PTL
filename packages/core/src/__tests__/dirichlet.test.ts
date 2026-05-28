import { describe, it, expect, beforeEach } from 'vitest';
import { DirichletDistribution } from '../bayesian/dirichlet.js';

describe('DirichletDistribution', () => {
  describe('constructor', () => {
    it('should create with initial alphas', () => {
      const alphas = new Map([
        ['string', 2],
        ['number', 3],
        ['boolean', 1],
      ]);
      const dist = new DirichletDistribution(alphas);
      expect(dist.getAlpha('string')).toBe(2);
      expect(dist.getAlpha('number')).toBe(3);
      expect(dist.getAlpha('boolean')).toBe(1);
    });

    it('should create empty distribution', () => {
      const dist = new DirichletDistribution();
      expect(dist.dimension).toBe(0);
    });

    it('should return 0 for unknown types', () => {
      const dist = new DirichletDistribution(new Map([['string', 1]]));
      expect(dist.getAlpha('unknown_type')).toBe(0);
    });
  });

  describe('mean probabilities', () => {
    it('should compute E[p_i] = α_i / Σα correctly', () => {
      const alphas = new Map([
        ['string', 2],
        ['number', 3],
        ['boolean', 1],
      ]);
      const dist = new DirichletDistribution(alphas);
      // α_0 = 2 + 3 + 1 = 6
      expect(dist.mean('string')).toBeCloseTo(2 / 6, 10);
      expect(dist.mean('number')).toBeCloseTo(3 / 6, 10);
      expect(dist.mean('boolean')).toBeCloseTo(1 / 6, 10);
    });

    it('should return 0 for empty distribution', () => {
      const dist = new DirichletDistribution();
      expect(dist.mean('string')).toBe(0);
    });

    it('should sum to 1.0', () => {
      const alphas = new Map([
        ['a', 5],
        ['b', 3],
        ['c', 2],
        ['d', 7],
      ]);
      const dist = new DirichletDistribution(alphas);
      const sum = ['a', 'b', 'c', 'd'].reduce((s, t) => s + dist.mean(t), 0);
      expect(sum).toBeCloseTo(1.0, 10);
    });
  });

  describe('variance', () => {
    it('should compute Var[p_i] correctly', () => {
      const alphas = new Map([
        ['string', 2],
        ['number', 3],
      ]);
      const dist = new DirichletDistribution(alphas);
      // α_0 = 5, Var[p_i] = α_i(α_0 - α_i) / (α_0² * (α_0+1))
      const expected = (2 * (5 - 2)) / (25 * 6);
      expect(dist.variance('string')).toBeCloseTo(expected, 10);
    });

    it('should return 0 for empty or single-element', () => {
      const dist = new DirichletDistribution();
      expect(dist.variance('string')).toBe(0);
    });

    it('should decrease as concentration increases', () => {
      const low = new DirichletDistribution(
        new Map([
          ['a', 1],
          ['b', 1],
        ])
      );
      const high = new DirichletDistribution(
        new Map([
          ['a', 100],
          ['b', 100],
        ])
      );
      expect(high.variance('a')).toBeLessThan(low.variance('a'));
    });
  });

  describe('observe (Bayesian update)', () => {
    it('should increment alpha on observation', () => {
      const dist = new DirichletDistribution(
        new Map([
          ['string', 1],
          ['number', 1],
        ])
      );
      dist.observe('string');
      expect(dist.getAlpha('string')).toBe(2);
      expect(dist.getAlpha('number')).toBe(1);
    });

    it('should accept weighted observations', () => {
      const dist = new DirichletDistribution(new Map([['string', 1]]));
      dist.observe('string', 5);
      expect(dist.getAlpha('string')).toBe(6);
    });

    it('should create new type on first observation', () => {
      const dist = new DirichletDistribution(new Map([['string', 1]]));
      dist.observe('number', 2);
      expect(dist.getAlpha('number')).toBe(2);
      expect(dist.dimension).toBe(2);
    });

    it('should shift probability toward observed type', () => {
      const dist = new DirichletDistribution(
        new Map([
          ['string', 1],
          ['number', 1],
        ])
      );
      const beforeString = dist.mean('string');
      dist.observe('string', 10);
      expect(dist.mean('string')).toBeGreaterThan(beforeString);
    });
  });

  describe('observeMultiple', () => {
    it('should apply batch observations', () => {
      const dist = new DirichletDistribution(
        new Map([
          ['string', 1],
          ['number', 1],
        ])
      );
      dist.observeMultiple(
        new Map([
          ['string', 3],
          ['number', 1],
        ])
      );
      expect(dist.getAlpha('string')).toBe(4);
      expect(dist.getAlpha('number')).toBe(2);
    });
  });

  describe('mode', () => {
    it('should compute mode for concentrated distribution', () => {
      const dist = new DirichletDistribution(
        new Map([
          ['a', 10],
          ['b', 5],
        ])
      );
      expect(dist.mode('a')).toBeGreaterThan(dist.mode('b'));
    });

    it('should fall back to mean for low concentration', () => {
      const dist = new DirichletDistribution(
        new Map([
          ['a', 0.5],
          ['b', 0.5],
        ])
      );
      expect(dist.mode('a')).toBeCloseTo(dist.mean('a'), 5);
    });
  });

  describe('confidenceInterval', () => {
    it('should produce valid interval', () => {
      const dist = new DirichletDistribution(
        new Map([
          ['string', 10],
          ['number', 5],
        ])
      );
      const ci = dist.confidenceInterval('string', 0.95);
      expect(ci.lower).toBeGreaterThanOrEqual(0);
      expect(ci.upper).toBeLessThanOrEqual(1);
      expect(ci.lower).toBeLessThan(ci.upper);
      expect(ci.level).toBe(0.95);
    });

    it('should contain the mean', () => {
      const dist = new DirichletDistribution(
        new Map([
          ['string', 10],
          ['number', 5],
        ])
      );
      const ci = dist.confidenceInterval('string', 0.95);
      const mean = dist.mean('string');
      expect(ci.lower).toBeLessThanOrEqual(mean);
      expect(ci.upper).toBeGreaterThanOrEqual(mean);
    });

    it('should narrow with more observations', () => {
      const low = new DirichletDistribution(
        new Map([
          ['a', 2],
          ['b', 2],
        ])
      );
      const high = new DirichletDistribution(
        new Map([
          ['a', 200],
          ['b', 200],
        ])
      );
      const ciLow = low.confidenceInterval('a');
      const ciHigh = high.confidenceInterval('a');
      expect(ciHigh.upper - ciHigh.lower).toBeLessThan(ciLow.upper - ciLow.lower);
    });
  });

  describe('entropy', () => {
    it('should be 0 for degenerate distribution', () => {
      const dist = new DirichletDistribution(new Map([['string', 100]]));
      expect(dist.entropy()).toBeCloseTo(0, 5);
    });

    it('should be maximum for uniform distribution', () => {
      const uniform = new DirichletDistribution(
        new Map([
          ['a', 1],
          ['b', 1],
          ['c', 1],
        ])
      );
      const skewed = new DirichletDistribution(
        new Map([
          ['a', 100],
          ['b', 1],
          ['c', 1],
        ])
      );
      expect(uniform.entropy()).toBeGreaterThan(skewed.entropy());
    });
  });

  describe('getBeliefs', () => {
    it('should return sorted beliefs', () => {
      const dist = new DirichletDistribution(
        new Map([
          ['string', 5],
          ['number', 10],
          ['boolean', 1],
        ])
      );
      const beliefs = dist.getBeliefs();
      expect(beliefs.length).toBe(3);
      expect(beliefs[0]!.typeId).toBe('number');
      expect(beliefs[0]!.probability).toBeGreaterThan(beliefs[1]!.probability);
    });
  });

  describe('getMostLikely', () => {
    it('should return the highest probability type', () => {
      const dist = new DirichletDistribution(
        new Map([
          ['string', 1],
          ['number', 10],
        ])
      );
      expect(dist.getMostLikely()).toBe('number');
    });
  });

  describe('merge', () => {
    it('should merge two distributions', () => {
      const a = new DirichletDistribution(new Map([['string', 10]]));
      const b = new DirichletDistribution(new Map([['string', 20]]));
      const merged = a.merge(b, 0.5);
      expect(merged.getAlpha('string')).toBeCloseTo(15, 5);
    });

    it('should handle disjoint type sets', () => {
      const a = new DirichletDistribution(new Map([['string', 5]]));
      const b = new DirichletDistribution(new Map([['number', 10]]));
      const merged = a.merge(b, 0.5);
      expect(merged.getAlpha('string')).toBeCloseTo(2.5, 5);
      expect(merged.getAlpha('number')).toBeCloseTo(5, 5);
    });
  });

  describe('clone', () => {
    it('should create independent copy', () => {
      const original = new DirichletDistribution(new Map([['string', 5]]));
      const cloned = original.clone();
      cloned.observe('string', 10);
      expect(original.getAlpha('string')).toBe(5);
      expect(cloned.getAlpha('string')).toBe(15);
    });
  });

  describe('serialization', () => {
    it('should roundtrip through JSON', () => {
      const original = new DirichletDistribution(
        new Map([
          ['string', 5],
          ['number', 3],
        ])
      );
      const json = original.toJSON() as { alphas: Record<string, number> };
      const restored = DirichletDistribution.fromJSON(json);
      expect(restored.getAlpha('string')).toBe(5);
      expect(restored.getAlpha('number')).toBe(3);
    });
  });
});
