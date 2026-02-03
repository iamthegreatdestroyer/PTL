/**
 * Incremental Updates Module
 *
 * Implements O(1) incremental type inference updates.
 * Instead of re-analyzing the entire codebase when changes occur,
 * we track dependencies and only update affected symbols.
 *
 * Key features:
 * - Dependency graph tracking
 * - Change propagation
 * - Delta-based updates
 * - Lazy re-inference
 *
 * @packageDocumentation
 */

export { IncrementalUpdater, createIncrementalUpdater } from './incremental-updater.js';
export { DependencyGraph } from './dependency-graph.js';
export type {
  UpdateDelta,
  DependencyNode,
  PropagationResult,
  ChangeKind,
  DependencyKind,
  UpdateOptions,
} from './types.js';
