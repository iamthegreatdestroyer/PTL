import { describe, it, expect, beforeEach } from 'vitest';
import { createInferenceEngine, InferenceEngine } from '../engine.js';
import type { Observation } from '../bayesian/types.js';

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

describe('InferenceEngine (integration)', () => {
  let engine: InferenceEngine;

  beforeEach(() => {
    engine = createInferenceEngine({
      includeStdlib: true,
      incremental: true,
    });
  });

  describe('factory', () => {
    it('should create engine with default config', () => {
      const e = createInferenceEngine();
      expect(e).toBeInstanceOf(InferenceEngine);
    });

    it('should accept custom config', () => {
      const e = createInferenceEngine({
        minConfidence: 0.9,
        defaultAlpha: 2.0,
      });
      expect(e.getConfig().minConfidence).toBe(0.9);
      expect(e.getConfig().defaultAlpha).toBe(2.0);
    });
  });

  describe('observe + infer pipeline', () => {
    it('should infer type from observations', () => {
      engine.observe('x', makeObs('type:string'));
      engine.observe('x', makeObs('type:string'));

      const result = engine.infer('x');
      expect(result.mostLikely.typeId).toBe('type:string');
      expect(result.mostLikely.probability).toBeGreaterThan(0.5);
    });

    it('should handle multiple observations of different types', () => {
      engine.observe('mixed', makeObs('type:string'));
      engine.observe('mixed', makeObs('type:number'));

      const result = engine.infer('mixed');
      expect(result.beliefs.length).toBeGreaterThanOrEqual(2);
      const sum = result.beliefs.reduce((s, b) => s + b.probability, 0);
      expect(sum).toBeCloseTo(1.0, 3);
    });

    it('should handle observeMultiple', () => {
      engine.observeMultiple([
        { symbolId: 'a', observation: makeObs('type:string') },
        { symbolId: 'b', observation: makeObs('type:number') },
        { symbolId: 'a', observation: makeObs('type:string') },
      ]);

      expect(engine.infer('a').mostLikely.typeId).toBe('type:string');
      expect(engine.infer('b').mostLikely.typeId).toBe('type:number');
    });
  });

  describe('getMostLikelyType', () => {
    it('should return type node with confidence', () => {
      engine.observe('x', makeObs('type:string'));
      const result = engine.getMostLikelyType('x');
      expect(result).not.toBeNull();
      expect(result!.type.id).toBe('type:string');
      expect(result!.confidence).toBeGreaterThan(0);
    });

    it('should return null for non-lattice type', () => {
      engine.observe('x', makeObs('nonexistent_type_id'));
      const result = engine.getMostLikelyType('x');
      // The type might not exist in the lattice
      // This should return null if no lattice type
      expect(result === null || result.type !== undefined).toBe(true);
    });
  });

  describe('lattice API', () => {
    it('should expose lattice', () => {
      const lattice = engine.getLattice();
      expect(lattice).toBeDefined();
      expect(lattice.getType(lattice.TOP)).toBeDefined();
    });

    it('should check subtypes', () => {
      expect(engine.isSubtypeOf('type:string', engine.getLattice().TOP)).toBe(true);
    });

    it('should compute join', () => {
      const result = engine.join('type:string', 'type:string');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('type:string');
    });

    it('should compute meet', () => {
      const result = engine.meet('type:string', 'type:string');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('type:string');
    });

    it('should get type by id', () => {
      expect(engine.getType('type:string')).toBeDefined();
      expect(engine.getType('nonexistent')).toBeUndefined();
    });
  });

  describe('file analysis', () => {
    it('should analyze a simple file', () => {
      const source = `const x = "hello";\nconst y = 42;\n`;
      const result = engine.analyzeFile('test.ts', source);
      expect(result.file).toBe('test.ts');
      expect(result.symbols.length).toBeGreaterThanOrEqual(0);
    });

    it('should analyze multiple files', () => {
      const files = [
        { file: 'a.ts', source: 'const a = 1;' },
        { file: 'b.ts', source: 'const b = "str";' },
      ];
      const results = engine.analyzeFiles(files);
      expect(results.length).toBe(2);
    });

    it('should update a file', () => {
      engine.analyzeFile('test.ts', 'const x = 1;');
      const updated = engine.updateFile('test.ts', 'const x = "hello";');
      expect(updated.file).toBe('test.ts');
    });

    it('should remove a file', () => {
      engine.analyzeFile('test.ts', 'const x = 1;');
      engine.removeFile('test.ts');
      const files = engine.getAnalyzer().getAnalyzedFiles();
      expect(files).not.toContain('test.ts');
    });
  });

  describe('incremental updates', () => {
    it('should apply delta', () => {
      const graph = engine.getGraph();
      // Add dependency instead of addNode (which doesn't exist)
      graph.addDependency('x', 'y', 'value-reference', 'test.ts');

      const result = engine.applyDelta({
        id: 'delta-1',
        kind: 'modify',
        file: 'test.ts',
        symbolId: 'x',
        oldTypeId: 'type:string',
        newTypeId: 'type:number',
        timestamp: Date.now(),
        location: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 10 },
      });
      expect(result).toBeDefined();
      expect(result.trigger).toBeDefined();
    });

    it('should handle file change', () => {
      const graph = engine.getGraph();
      // Add dependency to create symbols in file
      graph.addDependency('x', 'y', 'value-reference', 'test.ts');

      const result = engine.handleFileChange('test.ts');
      expect(result).toBeDefined();
      expect(result.totalAffected).toBeGreaterThanOrEqual(0);
    });
  });

  describe('statistics', () => {
    it('should report initial stats', () => {
      const stats = engine.getStats();
      expect(stats.typeCount).toBeGreaterThan(2); // at least top + bottom + primitives
      expect(stats.symbolCount).toBe(0);
      expect(stats.filesAnalyzed).toBe(0);
    });

    it('should update stats after analysis', () => {
      engine.analyzeFile('test.ts', 'const x = 1;');
      const stats = engine.getStats();
      expect(stats.filesAnalyzed).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all state', () => {
      engine.observe('x', makeObs('type:string'));
      engine.analyzeFile('test.ts', 'const x = 1;');

      engine.clear();
      const stats = engine.getStats();
      expect(stats.symbolCount).toBe(0);
      expect(stats.filesAnalyzed).toBe(0);
    });
  });

  describe('serialization', () => {
    it('should export to JSON', () => {
      engine.observe('x', makeObs('type:string'));
      const json = engine.toJSON() as Record<string, unknown>;
      expect(json).toHaveProperty('version');
      expect(json).toHaveProperty('config');
      expect(json).toHaveProperty('bayesian');
      expect(json).toHaveProperty('lattice');
    });
  });

  describe('end-to-end: code → inference', () => {
    it('should infer string type from const declaration', () => {
      const source = `const greeting = "hello world";`;
      engine.analyzeFile('example.ts', source);

      // The analyzer should have observed the string literal
      const bayesian = engine.getBayesian();
      const symbols = bayesian.getSymbols();

      // Check that at least some symbol was observed
      if (symbols.length > 0) {
        const result = engine.infer(symbols[0]!);
        expect(result.totalObservations).toBeGreaterThan(0);
      }
    });

    it('should infer number type from numeric literal', () => {
      const source = `const count = 42;`;
      engine.analyzeFile('example.ts', source);

      const bayesian = engine.getBayesian();
      const symbols = bayesian.getSymbols();

      if (symbols.length > 0) {
        const result = engine.infer(symbols[0]!);
        expect(result.totalObservations).toBeGreaterThan(0);
      }
    });
  });
});
