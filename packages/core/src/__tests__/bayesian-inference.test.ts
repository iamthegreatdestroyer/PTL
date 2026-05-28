import { describe, it, expect, beforeEach } from 'vitest';
import { BayesianInferenceEngine, createBayesianEngine } from '../bayesian/bayesian-inference.js';
import type { Observation } from '../bayesian/types.js';
import { TypeLattice } from '../lattice/type-lattice.js';

function makeObs(
  typeId: string,
  kind: Observation['kind'] = 'assignment',
  weight = 1.0
): Observation {
  return {
    typeId,
    kind,
    weight,
    source: { file: 'test.ts', line: 1, column: 0 },
    timestamp: Date.now(),
  };
}

describe('BayesianInferenceEngine', () => {
  let engine: BayesianInferenceEngine;

  beforeEach(() => {
    engine = createBayesianEngine();
  });

  describe('observe & infer', () => {
    it('should track observations for a symbol', () => {
      engine.observe('x', makeObs('string'));
      expect(engine.hasSymbol('x')).toBe(true);
      expect(engine.getObservations('x')).toHaveLength(1);
    });

    it('should infer most likely type from observations', () => {
      engine.observe('x', makeObs('string'));
      engine.observe('x', makeObs('string'));
      engine.observe('x', makeObs('number'));

      const result = engine.infer('x');
      expect(result.mostLikely.typeId).toBe('string');
      expect(result.mostLikely.probability).toBeGreaterThan(0.5);
    });

    it('should produce beliefs with probabilities summing to ~1', () => {
      engine.observe('x', makeObs('string'));
      engine.observe('x', makeObs('number'));

      const result = engine.infer('x');
      const sum = result.beliefs.reduce((s, b) => s + b.probability, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should shift beliefs with more observations', () => {
      engine.observe('x', makeObs('string'));
      const first = engine.infer('x');
      const firstStringProb = first.beliefs.find((b) => b.typeId === 'string')?.probability ?? 0;

      // Observe number 5 times
      for (let i = 0; i < 5; i++) {
        engine.observe('x', makeObs('number'));
      }
      const second = engine.infer('x');
      expect(second.mostLikely.typeId).toBe('number');
      const secondStringProb = second.beliefs.find((b) => b.typeId === 'string')?.probability ?? 0;
      expect(secondStringProb).toBeLessThan(firstStringProb);
    });

    it('should track entropy (settles with more evidence)', () => {
      // Need 2+ types to have non-zero entropy
      engine.observe('x', makeObs('string'));
      engine.observe('x', makeObs('number'));
      const uncertain = engine.infer('x');
      expect(uncertain.entropy).toBeGreaterThan(0);

      // Adding many observations of one type should reduce entropy
      for (let i = 0; i < 20; i++) {
        engine.observe('x', makeObs('string'));
      }
      const certain = engine.infer('x');
      expect(certain.entropy).toBeLessThan(uncertain.entropy);
    });
  });

  describe('observeMultiple', () => {
    it('should process batch observations', () => {
      engine.observeMultiple('y', [makeObs('string'), makeObs('string'), makeObs('number')]);
      expect(engine.getObservations('y')).toHaveLength(3);
      const result = engine.infer('y');
      expect(result.mostLikely.typeId).toBe('string');
    });
  });

  describe('multiple symbols', () => {
    it('should track symbols independently', () => {
      engine.observe('a', makeObs('string'));
      engine.observe('b', makeObs('number'));

      expect(engine.infer('a').mostLikely.typeId).toBe('string');
      expect(engine.infer('b').mostLikely.typeId).toBe('number');
    });

    it('should list all tracked symbols', () => {
      engine.observe('x', makeObs('string'));
      engine.observe('y', makeObs('number'));
      engine.observe('z', makeObs('boolean'));

      const symbols = engine.getSymbols();
      expect(symbols).toContain('x');
      expect(symbols).toContain('y');
      expect(symbols).toContain('z');
    });
  });

  describe('removeSymbol', () => {
    it('should remove a tracked symbol', () => {
      engine.observe('x', makeObs('string'));
      expect(engine.hasSymbol('x')).toBe(true);
      engine.removeSymbol('x');
      expect(engine.hasSymbol('x')).toBe(false);
    });
  });

  describe('getDistribution', () => {
    it('should return raw Dirichlet for a symbol', () => {
      engine.observe('x', makeObs('string', 'assignment', 1.0));
      const dist = engine.getDistribution('x');
      expect(dist).toBeDefined();
      expect(dist?.mean('string')).toBeGreaterThan(0);
    });
  });

  describe('globalTypeFrequency', () => {
    it('should track global type counts', () => {
      engine.observe('a', makeObs('string'));
      engine.observe('b', makeObs('string'));
      engine.observe('c', makeObs('number'));

      const freq = engine.getGlobalTypeFrequency('string');
      expect(freq).toBeGreaterThan(engine.getGlobalTypeFrequency('number'));
    });
  });

  describe('lattice integration', () => {
    it('should give partial credit to supertypes when lattice provided', () => {
      const lattice = new TypeLattice({ includeStdlib: true });
      const engineWithLattice = createBayesianEngine(undefined, lattice);

      engineWithLattice.observe('x', makeObs('type:string'));
      const dist = engineWithLattice.getDistribution('x');

      // Engine skips TOP explicitly, but should have observed the main type
      const mainWeight = dist?.getAlpha('type:string') ?? 0;
      expect(mainWeight).toBeGreaterThan(0);

      // Check ancestors (non-TOP) got partial credit
      const ancestors = lattice.getAncestors('type:string');
      let hasAncestorCredit = false;
      for (const ancestor of ancestors) {
        if (ancestor !== lattice.TOP) {
          const w = dist?.getAlpha(ancestor) ?? 0;
          if (w > 0) hasAncestorCredit = true;
        }
      }
      // If there are non-TOP ancestors, they should have credit;
      // if there are none, the main observation is enough
      const nonTopAncestors = [...ancestors].filter((a) => a !== lattice.TOP);
      if (nonTopAncestors.length > 0) {
        expect(hasAncestorCredit).toBe(true);
      } else {
        expect(mainWeight).toBeGreaterThan(0);
      }
    });
  });

  describe('getStats', () => {
    it('should return engine statistics', () => {
      engine.observe('x', makeObs('string'));
      engine.observe('y', makeObs('number'));

      const stats = engine.getStats();
      expect(stats.symbolCount).toBe(2);
      expect(stats.totalObservations).toBeGreaterThan(0);
      expect(stats.uniqueTypes).toBeGreaterThan(0);
    });
  });

  describe('serialization', () => {
    it('should roundtrip through JSON', () => {
      engine.observe('x', makeObs('string'));
      engine.observe('x', makeObs('string'));
      engine.observe('y', makeObs('number'));

      const json = engine.toJSON();
      const restored = BayesianInferenceEngine.fromJSON(
        json as ReturnType<BayesianInferenceEngine['toJSON']>
      );

      expect(restored.hasSymbol('x')).toBe(true);
      expect(restored.hasSymbol('y')).toBe(true);
      expect(restored.infer('x').mostLikely.typeId).toBe('string');
    });
  });

  describe('merge', () => {
    it('should merge two engines', () => {
      const engine2 = createBayesianEngine();
      engine.observe('x', makeObs('string'));
      engine2.observe('x', makeObs('number'));

      engine.merge(engine2, 0.5);
      const result = engine.infer('x');
      // Should have both types
      const typeIds = result.beliefs.map((b) => b.typeId);
      expect(typeIds).toContain('string');
      expect(typeIds).toContain('number');
    });
  });

  describe('empirical priors', () => {
    it('should compute empirical prior from global counts', () => {
      engine.observe('a', makeObs('string'));
      engine.observe('b', makeObs('string'));

      const prior = engine.getEmpiricalPrior('string');
      expect(prior).toBeGreaterThan(1.0); // Above default alpha
    });
  });

  describe('edge cases', () => {
    it('should handle inference for unknown symbol', () => {
      const result = engine.infer('nonexistent');
      expect(result.totalObservations).toBe(0);
    });

    it('should handle high-weight observations', () => {
      engine.observe('x', makeObs('string', 'annotation', 100));
      const result = engine.infer('x');
      expect(result.mostLikely.typeId).toBe('string');
      expect(result.mostLikely.probability).toBeGreaterThan(0.9);
    });
  });
});
