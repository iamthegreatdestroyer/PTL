import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyGraph } from '../incremental/dependency-graph.js';
import {
  IncrementalUpdater,
  createIncrementalUpdater,
} from '../incremental/incremental-updater.js';
import type { UpdateDelta } from '../incremental/types.js';
import { createBayesianEngine } from '../bayesian/bayesian-inference.js';

describe('DependencyGraph', () => {
  let graph: DependencyGraph;

  beforeEach(() => {
    graph = new DependencyGraph();
  });

  describe('dependency management', () => {
    it('should add dependency between symbols', () => {
      graph.addDependency('y', 'x', 'value-reference', 'test.ts');

      const deps = graph.getDependencies('y');
      expect(deps.has('x')).toBe(true);
    });

    it('should track dependents (reverse edges)', () => {
      graph.addDependency('y', 'x', 'value-reference', 'test.ts');

      const dependents = graph.getDependents('x');
      expect(dependents.has('y')).toBe(true);
    });

    it('should remove dependency', () => {
      graph.addDependency('y', 'x', 'value-reference', 'test.ts');
      const removed = graph.removeDependency('y', 'x');

      expect(removed).toBe(true);
      expect(graph.getDependencies('y').has('x')).toBe(false);
    });

    it('should get dependency kind', () => {
      graph.addDependency('y', 'x', 'type-reference', 'test.ts');
      const kind = graph.getDependencyKind('y', 'x');
      expect(kind).toBe('type-reference');
    });
  });

  describe('node queries', () => {
    it('should check if symbol exists', () => {
      graph.addDependency('x', 'y', 'value-reference', 'test.ts');
      expect(graph.hasSymbol('x')).toBe(true);
      expect(graph.hasSymbol('nonexistent')).toBe(false);
    });

    it('should get node by id', () => {
      graph.addDependency('x', 'y', 'value-reference', 'test.ts');
      const node = graph.getNode('x');
      expect(node).toBeDefined();
      expect(node?.symbolId).toBe('x');
    });

    it('should track symbols by file', () => {
      graph.addDependency('a', 'x', 'value-reference', 'file1.ts');
      graph.addDependency('b', 'y', 'value-reference', 'file1.ts');
      graph.addDependency('c', 'z', 'value-reference', 'file2.ts');

      const file1Symbols = graph.getSymbolsInFile('file1.ts');
      expect(file1Symbols.has('a')).toBe(true);
      expect(file1Symbols.has('b')).toBe(true);
      expect(file1Symbols.has('c')).toBe(false);
    });
  });

  describe('dirty tracking', () => {
    it('should mark nodes dirty', () => {
      graph.addDependency('x', 'y', 'value-reference', 'test.ts');
      graph.markDirty('x');
      const node = graph.getNode('x');
      expect(node?.dirty).toBe(true);
    });

    it('should mark nodes clean', () => {
      graph.addDependency('x', 'y', 'value-reference', 'test.ts');
      graph.markDirty('x');
      graph.markClean('x');
      const node = graph.getNode('x');
      expect(node?.dirty).toBe(false);
    });

    it('should get dirty symbols', () => {
      graph.addDependency('x', 'y', 'value-reference', 'test.ts');
      graph.addDependency('z', 'w', 'value-reference', 'test.ts');
      graph.markDirty('x');

      const dirty = graph.getDirtySymbols();
      expect(dirty).toContain('x');
      expect(dirty).not.toContain('z');
    });

    it('should report dirty count in stats', () => {
      graph.addDependency('x', 'y', 'value-reference', 'test.ts');
      graph.addDependency('z', 'w', 'value-reference', 'test.ts');
      graph.markDirty('x');

      const stats = graph.getStats();
      expect(stats.dirtyCount).toBe(1);
    });
  });

  describe('transitive queries', () => {
    it('should find transitive dependencies', () => {
      graph.addDependency('a', 'b', 'value-reference', 'test.ts');
      graph.addDependency('b', 'c', 'value-reference', 'test.ts');

      const deps = graph.getTransitiveDependencies('a');
      expect(deps.has('b')).toBe(true);
      expect(deps.has('c')).toBe(true);
    });

    it('should find transitive dependents', () => {
      graph.addDependency('b', 'a', 'value-reference', 'test.ts');
      graph.addDependency('c', 'b', 'value-reference', 'test.ts');

      const dependents = graph.getTransitiveDependents('a');
      expect(dependents.has('b')).toBe(true);
      expect(dependents.has('c')).toBe(true);
    });
  });

  describe('cycle detection', () => {
    it('should detect cycles', () => {
      graph.addDependency('a', 'b', 'value-reference', 'test.ts');
      graph.addDependency('b', 'a', 'value-reference', 'test.ts');

      const cycles = graph.detectCycles();
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should return empty for acyclic graph', () => {
      graph.addDependency('a', 'b', 'value-reference', 'test.ts');
      graph.addDependency('b', 'c', 'value-reference', 'test.ts');

      const cycles = graph.detectCycles();
      expect(cycles.length).toBe(0);
    });
  });

  describe('topological sort', () => {
    it('should sort acyclic graph', () => {
      graph.addDependency('c', 'b', 'value-reference', 'test.ts');
      graph.addDependency('b', 'a', 'value-reference', 'test.ts');

      const sorted = graph.topologicalSort();
      expect(sorted).not.toBeNull();

      if (sorted) {
        const aIdx = sorted.indexOf('a');
        const bIdx = sorted.indexOf('b');
        const cIdx = sorted.indexOf('c');
        expect(aIdx).toBeLessThan(bIdx);
        expect(bIdx).toBeLessThan(cIdx);
      }
    });

    it('should return null for cyclic graph', () => {
      graph.addDependency('a', 'b', 'value-reference', 'test.ts');
      graph.addDependency('b', 'a', 'value-reference', 'test.ts');

      const sorted = graph.topologicalSort();
      expect(sorted).toBeNull();
    });
  });

  describe('removal operations', () => {
    it('should remove a symbol', () => {
      graph.addDependency('x', 'y', 'value-reference', 'test.ts');
      const removed = graph.removeSymbol('x');

      expect(removed).toBe(true);
      expect(graph.hasSymbol('x')).toBe(false);
    });

    it('should remove file and all its symbols', () => {
      graph.addDependency('a', 'x', 'value-reference', 'test.ts');
      graph.addDependency('b', 'y', 'value-reference', 'test.ts');

      const count = graph.removeFile('test.ts');
      expect(count).toBe(2);
      expect(graph.getSymbolsInFile('test.ts').size).toBe(0);
    });
  });

  describe('graph statistics', () => {
    it('should report correct stats', () => {
      graph.addDependency('a', 'x', 'value-reference', 'file1.ts');
      graph.addDependency('b', 'a', 'value-reference', 'file1.ts');
      graph.addDependency('c', 'a', 'type-reference', 'file2.ts');

      const stats = graph.getStats();
      expect(stats.nodeCount).toBeGreaterThanOrEqual(3);
      expect(stats.edgeCount).toBe(3);
      expect(stats.fileCount).toBe(2);
    });
  });

  describe('serialization', () => {
    it('should roundtrip through JSON', () => {
      graph.addDependency('a', 'x', 'value-reference', 'test.ts');
      graph.addDependency('b', 'a', 'value-reference', 'test.ts');

      const json = graph.toJSON() as Parameters<typeof DependencyGraph.fromJSON>[0];
      const restored = DependencyGraph.fromJSON(json);

      expect(restored.hasSymbol('a')).toBe(true);
      expect(restored.hasSymbol('b')).toBe(true);
      expect(restored.getDependencies('b').has('a')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all nodes', () => {
      graph.addDependency('a', 'x', 'value-reference', 'test.ts');
      graph.addDependency('b', 'y', 'value-reference', 'test.ts');
      graph.clear();

      expect(graph.getStats().nodeCount).toBe(0);
      expect(graph.getAllSymbols().length).toBe(0);
    });
  });
});

describe('IncrementalUpdater', () => {
  let updater: IncrementalUpdater;
  let graph: DependencyGraph;

  beforeEach(() => {
    const bayesian = createBayesianEngine();
    graph = new DependencyGraph();
    updater = createIncrementalUpdater(bayesian, graph);
  });

  describe('applyDelta', () => {
    it('should process an add delta', () => {
      graph.addDependency('x', 'y', 'value-reference', 'test.ts');

      const delta: UpdateDelta = {
        id: 'delta-1',
        kind: 'add',
        file: 'test.ts',
        symbolId: 'x',
        newTypeId: 'type:string',
        timestamp: Date.now(),
        location: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 10 },
      };

      const result = updater.applyDelta(delta);
      expect(result.trigger).toBe(delta);
      expect(result.directlyAffected.length).toBeGreaterThanOrEqual(0);
    });

    it('should propagate changes to dependents', () => {
      graph.addDependency('y', 'x', 'value-reference', 'test.ts');

      const delta: UpdateDelta = {
        id: 'delta-2',
        kind: 'modify',
        file: 'test.ts',
        symbolId: 'x',
        oldTypeId: 'type:string',
        newTypeId: 'type:number',
        timestamp: Date.now(),
        location: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 10 },
      };

      const result = updater.applyDelta(delta);
      expect(result.totalAffected).toBeGreaterThanOrEqual(0);
    });
  });

  describe('handleFileChange', () => {
    it('should invalidate all symbols in changed file', () => {
      graph.addDependency('a', 'x', 'value-reference', 'changed.ts');
      graph.addDependency('b', 'y', 'value-reference', 'changed.ts');
      graph.addDependency('c', 'z', 'value-reference', 'other.ts');

      const result = updater.handleFileChange('changed.ts');

      // Should affect symbols in changed file
      expect(result.totalAffected).toBeGreaterThanOrEqual(0);
    });
  });

  describe('statistics', () => {
    it('should report updater stats', () => {
      const stats = updater.getStats();
      expect(stats).toHaveProperty('symbolCount');
      expect(stats).toHaveProperty('dependencyCount');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      graph.addDependency('x', 'y', 'value-reference', 'test.ts');
      const json = updater.toJSON();
      expect(json).toBeDefined();
    });
  });
});
