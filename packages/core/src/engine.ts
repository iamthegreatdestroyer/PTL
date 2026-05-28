/**
 * Inference Engine
 *
 * Main factory function that creates a fully configured PTL inference engine.
 * This is the primary entry point for using PTL programmatically.
 *
 * @example
 * ```typescript
 * import { createInferenceEngine } from '@ptl/core';
 *
 * const engine = createInferenceEngine({
 *   includeStdlib: true,
 *   incremental: true,
 * });
 *
 * // Analyze a file
 * engine.analyzeFile('example.ts', source);
 *
 * // Get inference results
 * const result = engine.infer('example.ts#myVar');
 * console.log(result.mostLikely, result.confidence);
 * ```
 */

import { TypeLattice } from './lattice/type-lattice.js';
import type { LatticeConfig, TypeNode } from './lattice/types.js';
import { BayesianInferenceEngine, createBayesianEngine } from './bayesian/bayesian-inference.js';
import type { InferenceResult, Observation, InferenceOptions } from './bayesian/types.js';
import { IncrementalUpdater, createIncrementalUpdater } from './incremental/incremental-updater.js';
import { DependencyGraph } from './incremental/dependency-graph.js';
import type { UpdateDelta, PropagationResult } from './incremental/types.js';
import { Analyzer } from './analyzer/analyzer.js';
import type { AnalyzerConfig, AnalysisResult, FileAnalysisResult } from './analyzer/types.js';

/**
 * Configuration for the inference engine
 */
export interface InferenceEngineConfig {
  /** Whether to include standard library types */
  readonly includeStdlib: boolean;

  /** Whether to enable incremental mode */
  readonly incremental: boolean;

  /** Default alpha for Dirichlet priors */
  readonly defaultAlpha: number;

  /** Smoothing factor for priors */
  readonly smoothing: number;

  /** Minimum confidence threshold */
  readonly minConfidence: number;

  /** Maximum propagation depth for incremental updates */
  readonly maxPropagationDepth: number;

  /** Custom type priors */
  readonly typePriors?: ReadonlyMap<string, number>;

  /** Custom lattice configuration */
  readonly latticeConfig?: Partial<LatticeConfig>;

  /** Custom analyzer configuration */
  readonly analyzerConfig?: Partial<AnalyzerConfig>;
}

/**
 * Default engine configuration
 */
const DEFAULT_ENGINE_CONFIG: InferenceEngineConfig = {
  includeStdlib: true,
  incremental: true,
  defaultAlpha: 1.0,
  smoothing: 0.1,
  minConfidence: 0.5,
  maxPropagationDepth: 10,
};

/**
 * PTL Inference Engine
 *
 * The main engine that orchestrates all PTL components:
 * - Type Lattice: Manages type relationships
 * - Bayesian Inference: Computes probabilistic type beliefs
 * - Incremental Updates: Efficiently handles code changes
 * - Analyzer: Extracts observations from source code
 */
export class InferenceEngine {
  /** Version of the engine */
  static readonly VERSION = '1.0.0';

  /** Configuration */
  private readonly config: InferenceEngineConfig;

  /** Type lattice */
  private readonly lattice: TypeLattice;

  /** Bayesian inference engine */
  private readonly bayesian: BayesianInferenceEngine;

  /** Incremental updater */
  private readonly updater: IncrementalUpdater;

  /** Analyzer */
  private readonly analyzer: Analyzer;

  constructor(config?: Partial<InferenceEngineConfig>) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };

    // Initialize type lattice
    this.lattice = new TypeLattice({
      includeStdlib: this.config.includeStdlib,
      ...this.config.latticeConfig,
    });

    // Initialize Bayesian inference engine
    this.bayesian = createBayesianEngine(
      {
        defaultAlpha: this.config.defaultAlpha,
        typePriors: new Map(this.config.typePriors ?? []),
        smoothing: this.config.smoothing,
      },
      this.lattice
    );

    // Initialize incremental updater
    const graph = new DependencyGraph();
    this.updater = createIncrementalUpdater(this.bayesian, graph, {
      maxDepth: this.config.maxPropagationDepth,
      eagerReInference: false,
      minConfidenceChange: 0.05,
    });

    // Initialize analyzer
    this.analyzer = new Analyzer({
      minConfidence: this.config.minConfidence,
      incremental: this.config.incremental,
      ...this.config.analyzerConfig,
    });
  }

  // ==================== Core API ====================

  /**
   * Observe a type for a symbol
   *
   * This is the fundamental operation for collecting type evidence.
   *
   * @param symbolId - Unique identifier for the symbol
   * @param observation - The type observation
   */
  observe(symbolId: string, observation: Observation): void {
    this.bayesian.observe(symbolId, observation);
  }

  /**
   * Observe multiple types at once
   */
  observeMultiple(observations: Array<{ symbolId: string; observation: Observation }>): void {
    for (const { symbolId, observation } of observations) {
      this.observe(symbolId, observation);
    }
  }

  /**
   * Infer the type of a symbol
   *
   * Returns the posterior probability distribution over types.
   *
   * @param symbolId - Unique identifier for the symbol
   * @param options - Inference options
   */
  infer(symbolId: string, options?: Partial<InferenceOptions>): InferenceResult {
    return this.bayesian.infer(symbolId, options);
  }

  /**
   * Get the most likely type for a symbol
   */
  getMostLikelyType(symbolId: string): { type: TypeNode; confidence: number } | null {
    const result = this.infer(symbolId);
    const typeNode = this.lattice.getType(result.mostLikely.typeId);

    if (!typeNode) {
      return null;
    }

    return {
      type: typeNode,
      confidence: result.mostLikely.probability,
    };
  }

  // ==================== Analysis API ====================

  /**
   * Analyze a single file
   */
  analyzeFile(file: string, source: string): FileAnalysisResult {
    return this.analyzer.analyzeFile(file, source);
  }

  /**
   * Analyze multiple files
   */
  analyzeFiles(files: Array<{ file: string; source: string }>): FileAnalysisResult[] {
    return this.analyzer.analyzeFiles(files);
  }

  /**
   * Analyze a project directory
   */
  async analyzeProject(rootDir?: string): Promise<AnalysisResult> {
    return this.analyzer.analyzeProject(rootDir);
  }

  // ==================== Incremental API ====================

  /**
   * Apply an update delta
   */
  applyDelta(delta: UpdateDelta): PropagationResult {
    return this.updater.applyDelta(delta);
  }

  /**
   * Handle a file change
   */
  handleFileChange(file: string): PropagationResult {
    return this.updater.handleFileChange(file);
  }

  /**
   * Update a file with new source
   */
  updateFile(file: string, source: string): FileAnalysisResult {
    return this.analyzer.updateFile(file, source);
  }

  /**
   * Remove a file from analysis
   */
  removeFile(file: string): void {
    this.analyzer.removeFile(file);
  }

  // ==================== Lattice API ====================

  /**
   * Get the type lattice
   */
  getLattice(): TypeLattice {
    return this.lattice;
  }

  /**
   * Get a type from the lattice
   */
  getType(typeId: string): TypeNode | undefined {
    return this.lattice.getType(typeId);
  }

  /**
   * Check if one type is a subtype of another
   */
  isSubtypeOf(subtype: string, supertype: string): boolean {
    return this.lattice.isSubtypeOf(subtype, supertype);
  }

  /**
   * Get the join (least upper bound) of two types
   */
  join(a: string, b: string): TypeNode | null {
    const typeId = this.lattice.join(a, b);
    return this.lattice.getType(typeId) ?? null;
  }

  /**
   * Get the meet (greatest lower bound) of two types
   */
  meet(a: string, b: string): TypeNode | null {
    const typeId = this.lattice.meet(a, b);
    return this.lattice.getType(typeId) ?? null;
  }

  // ==================== Internal Access ====================

  /**
   * Get the Bayesian inference engine
   */
  getBayesian(): BayesianInferenceEngine {
    return this.bayesian;
  }

  /**
   * Get the incremental updater
   */
  getUpdater(): IncrementalUpdater {
    return this.updater;
  }

  /**
   * Get the analyzer
   */
  getAnalyzer(): Analyzer {
    return this.analyzer;
  }

  /**
   * Get the dependency graph
   */
  getGraph(): DependencyGraph {
    return this.updater.getGraph();
  }

  /**
   * Get configuration
   */
  getConfig(): InferenceEngineConfig {
    return this.config;
  }

  // ==================== Utility API ====================

  /**
   * Clear all state
   */
  clear(): void {
    this.analyzer.clear();
    this.updater.getGraph().clear();
  }

  /**
   * Get statistics about the engine
   */
  getStats(): {
    symbolCount: number;
    typeCount: number;
    dependencyCount: number;
    filesAnalyzed: number;
  } {
    const graphStats = this.updater.getGraph().getStats();

    return {
      symbolCount: graphStats.nodeCount,
      typeCount: this.lattice.getAllTypes().length,
      dependencyCount: graphStats.edgeCount,
      filesAnalyzed: this.analyzer.getAnalyzedFiles().length,
    };
  }

  /**
   * Export state for serialization
   */
  toJSON(): object {
    return {
      version: InferenceEngine.VERSION,
      config: this.config,
      lattice: this.lattice.toJSON(),
      bayesian: this.bayesian.toJSON(),
      updater: this.updater.toJSON(),
      analyzer: this.analyzer.toJSON(),
    };
  }
}

/**
 * Factory function to create an InferenceEngine
 *
 * @example
 * ```typescript
 * import { createEngine } from '@ptl/core';
 *
 * const engine = createEngine({
 *   includeStdlib: true,
 *   minConfidence: 0.7,
 * });
 * ```
 */
export function createInferenceEngine(config?: Partial<InferenceEngineConfig>): InferenceEngine {
  return new InferenceEngine(config);
}
