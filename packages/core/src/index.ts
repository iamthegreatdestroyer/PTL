/**
 * @ptl/core - Probabilistic Type Lattice Core Engine
 *
 * Bayesian type inference with confidence intervals.
 *
 * @packageDocumentation
 */

// =============================================================================
// Type Lattice
// =============================================================================
export {
  TypeLattice,
  createTypeLattice,
  type TypeNode,
  type TypeRelation,
  type LatticeConfig,
} from './lattice/index.js';

// =============================================================================
// Bayesian Inference
// =============================================================================
export {
  DirichletDistribution,
  BayesianInferenceEngine,
  createBayesianEngine,
  type TypeBelief,
  type PriorConfig,
  type InferenceResult,
  type ConfidenceInterval,
} from './bayesian/index.js';

// =============================================================================
// Incremental Updates
// =============================================================================
export {
  IncrementalUpdater,
  DependencyGraph,
  createIncrementalUpdater,
  type UpdateDelta,
  type DependencyNode,
  type PropagationResult,
} from './incremental/index.js';

// =============================================================================
// Analyzer
// =============================================================================
export {
  Analyzer,
  createAnalyzer,
  type AnalysisOptions,
  type AnalysisResult,
  type SymbolInference,
} from './analyzer/index.js';

// =============================================================================
// Main Entry Point
// =============================================================================
export { InferenceEngine, createInferenceEngine, type InferenceEngineConfig } from './engine.js';

// =============================================================================
// Version
// =============================================================================
export const VERSION = '1.0.0';
