/**
 * Incremental Updater
 *
 * Handles incremental updates to type inference when code changes.
 * Uses the dependency graph to propagate changes efficiently.
 */

import type { BayesianInferenceEngine } from '../bayesian/bayesian-inference.js';
import { DependencyGraph } from './dependency-graph.js';
import type {
  UpdateDelta,
  PropagationResult,
  UpdateOptions,
  UpdaterStats,
} from './types.js';

/**
 * Default update options
 */
const DEFAULT_OPTIONS: UpdateOptions = {
  maxDepth: 10,
  eagerReInference: false,
  minConfidenceChange: 0.05,
  trackMetrics: true,
};

/**
 * Incremental Updater
 *
 * Handles change propagation and incremental re-inference.
 */
export class IncrementalUpdater {
  /** Dependency graph */
  private readonly graph: DependencyGraph;

  /** Reference to inference engine */
  private readonly engine: BayesianInferenceEngine;

  /** Options */
  private readonly options: UpdateOptions;

  /** Queue of pending deltas */
  private readonly pendingDeltas: UpdateDelta[] = [];

  /** Statistics */
  private totalUpdates: number = 0;
  private totalPropagations: number = 0;

  constructor(
    engine: BayesianInferenceEngine,
    graph?: DependencyGraph,
    options?: Partial<UpdateOptions>
  ) {
    this.engine = engine;
    this.graph = graph ?? new DependencyGraph();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Get the dependency graph
   */
  getGraph(): DependencyGraph {
    return this.graph;
  }

  /**
   * Apply a delta to the system
   *
   * This is the main entry point for incremental updates.
   */
  applyDelta(delta: UpdateDelta): PropagationResult {
    const startTime = performance.now();
    this.totalUpdates++;

    const directlyAffected = new Set<string>();
    const transitivelyAffected = new Set<string>();
    const needsReInference: string[] = [];

    // Process based on change kind
    switch (delta.kind) {
      case 'add':
        this.handleAdd(delta, directlyAffected);
        break;
      case 'modify':
        this.handleModify(delta, directlyAffected);
        break;
      case 'delete':
        this.handleDelete(delta, directlyAffected);
        break;
      case 'rename':
        this.handleRename(delta, directlyAffected);
        break;
      case 'move':
        this.handleMove(delta, directlyAffected);
        break;
    }

    // Propagate to dependents
    if (directlyAffected.size > 0) {
      this.propagate(directlyAffected, transitivelyAffected);
    }

    // Mark all affected symbols as dirty
    for (const symbolId of directlyAffected) {
      this.graph.markDirty(symbolId);
      needsReInference.push(symbolId);
    }
    for (const symbolId of transitivelyAffected) {
      this.graph.markDirty(symbolId);
      needsReInference.push(symbolId);
    }

    // Eager re-inference if enabled
    if (this.options.eagerReInference) {
      this.reInferSymbols(needsReInference);
    }

    const propagationTimeMs = performance.now() - startTime;
    this.totalPropagations++;

    return {
      trigger: delta,
      directlyAffected: [...directlyAffected],
      transitivelyAffected: [...transitivelyAffected],
      totalAffected: directlyAffected.size + transitivelyAffected.size,
      needsReInference,
      propagationTimeMs,
    };
  }

  /**
   * Apply multiple deltas in batch
   */
  applyDeltas(deltas: UpdateDelta[]): PropagationResult[] {
    return deltas.map((delta) => this.applyDelta(delta));
  }

  /**
   * Handle symbol addition
   */
  private handleAdd(delta: UpdateDelta, affected: Set<string>): void {
    affected.add(delta.symbolId);

    // If we know the type, add an observation
    if (delta.newTypeId) {
      this.engine.observe(delta.symbolId, {
        typeId: delta.newTypeId,
        kind: 'assignment',
        weight: 1.0,
        source: {
          file: delta.file,
          line: delta.location.startLine,
          column: delta.location.startColumn,
        },
        timestamp: delta.timestamp,
      });
    }
  }

  /**
   * Handle symbol modification
   */
  private handleModify(delta: UpdateDelta, affected: Set<string>): void {
    affected.add(delta.symbolId);

    // If type changed, add observation for new type
    if (delta.newTypeId && delta.newTypeId !== delta.oldTypeId) {
      this.engine.observe(delta.symbolId, {
        typeId: delta.newTypeId,
        kind: 'assignment',
        weight: 1.0,
        source: {
          file: delta.file,
          line: delta.location.startLine,
          column: delta.location.startColumn,
        },
        timestamp: delta.timestamp,
      });
    }

    // Mark dependents as affected
    const dependents = this.graph.getDependents(delta.symbolId);
    for (const dep of dependents) {
      affected.add(dep);
    }
  }

  /**
   * Handle symbol deletion
   */
  private handleDelete(delta: UpdateDelta, affected: Set<string>): void {
    // Get dependents before removal
    const dependents = this.graph.getDependents(delta.symbolId);
    for (const dep of dependents) {
      affected.add(dep);
    }

    // Remove from graph
    this.graph.removeSymbol(delta.symbolId);

    // Remove from inference engine
    this.engine.removeSymbol(delta.symbolId);
  }

  /**
   * Handle symbol rename
   */
  private handleRename(delta: UpdateDelta, affected: Set<string>): void {
    // Treat as modify for now
    this.handleModify(delta, affected);
  }

  /**
   * Handle symbol move
   */
  private handleMove(delta: UpdateDelta, affected: Set<string>): void {
    // Update file in dependency graph
    affected.add(delta.symbolId);

    // Mark dependents as affected
    const dependents = this.graph.getDependents(delta.symbolId);
    for (const dep of dependents) {
      affected.add(dep);
    }
  }

  /**
   * Propagate changes through the dependency graph
   */
  private propagate(directlyAffected: Set<string>, transitivelyAffected: Set<string>): void {
    const queue = [...directlyAffected];
    let depth = 0;

    while (queue.length > 0 && depth < this.options.maxDepth) {
      const levelSize = queue.length;

      for (let i = 0; i < levelSize; i++) {
        const symbolId = queue.shift()!;
        const dependents = this.graph.getTransitiveDependents(symbolId, 1);

        for (const dep of dependents) {
          if (!directlyAffected.has(dep) && !transitivelyAffected.has(dep)) {
            transitivelyAffected.add(dep);
            queue.push(dep);
          }
        }
      }

      depth++;
    }
  }

  /**
   * Re-infer types for symbols
   */
  private reInferSymbols(symbolIds: string[]): void {
    for (const symbolId of symbolIds) {
      // Just infer - the engine handles caching
      this.engine.infer(symbolId);
      this.graph.markClean(symbolId);
    }
  }

  /**
   * Process all dirty symbols
   */
  processDirty(): string[] {
    const dirty = this.graph.getDirtySymbols();
    this.reInferSymbols(dirty);
    return dirty;
  }

  /**
   * Queue a delta for batch processing
   */
  queueDelta(delta: UpdateDelta): void {
    this.pendingDeltas.push(delta);
  }

  /**
   * Flush and process all queued deltas
   */
  flush(): PropagationResult[] {
    const deltas = [...this.pendingDeltas];
    this.pendingDeltas.length = 0;
    return this.applyDeltas(deltas);
  }

  /**
   * Get the number of pending deltas
   */
  getPendingCount(): number {
    return this.pendingDeltas.length;
  }

  /**
   * Handle file change (all symbols in file are affected)
   */
  handleFileChange(file: string): PropagationResult {
    const symbols = this.graph.getSymbolsInFile(file);
    const delta: UpdateDelta = {
      id: `file-change-${file}-${Date.now()}`,
      kind: 'modify',
      file,
      symbolId: `file:${file}`,
      timestamp: Date.now(),
      location: { startLine: 0, startColumn: 0, endLine: 0, endColumn: 0 },
    };

    const directlyAffected = new Set<string>(symbols);
    const transitivelyAffected = new Set<string>();

    this.propagate(directlyAffected, transitivelyAffected);

    const needsReInference: string[] = [...directlyAffected, ...transitivelyAffected];
    for (const symbolId of needsReInference) {
      this.graph.markDirty(symbolId);
    }

    return {
      trigger: delta,
      directlyAffected: [...directlyAffected],
      transitivelyAffected: [...transitivelyAffected],
      totalAffected: directlyAffected.size + transitivelyAffected.size,
      needsReInference,
      propagationTimeMs: 0,
    };
  }

  /**
   * Handle file deletion (remove all symbols in file)
   */
  handleFileDelete(file: string): number {
    return this.graph.removeFile(file);
  }

  /**
   * Get statistics about the updater
   */
  getStats(): UpdaterStats {
    const graphStats = this.graph.getStats();

    return {
      symbolCount: graphStats.nodeCount,
      dependencyCount: graphStats.edgeCount,
      dirtyCount: graphStats.dirtyCount,
      averageFanout: graphStats.averageFanout,
      maxFanout: graphStats.maxFanout,
      totalUpdates: this.totalUpdates,
      totalPropagations: this.totalPropagations,
    };
  }

  /**
   * Serialize to JSON
   */
  toJSON(): object {
    return {
      graph: this.graph.toJSON(),
      options: this.options,
      stats: {
        totalUpdates: this.totalUpdates,
        totalPropagations: this.totalPropagations,
      },
    };
  }
}

/**
 * Factory function to create an IncrementalUpdater
 */
export function createIncrementalUpdater(
  engine: BayesianInferenceEngine,
  graph?: DependencyGraph,
  options?: Partial<UpdateOptions>
): IncrementalUpdater {
  return new IncrementalUpdater(engine, graph, options);
}
