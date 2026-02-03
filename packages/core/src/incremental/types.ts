/**
 * Type definitions for the incremental update module
 */

/**
 * A delta representing a change in the codebase
 */
export interface UpdateDelta {
  /** Unique ID for this delta */
  readonly id: string;

  /** Kind of change */
  readonly kind: ChangeKind;

  /** Affected file path */
  readonly file: string;

  /** Affected symbol ID */
  readonly symbolId: string;

  /** The old type ID (for modifications/deletions) */
  readonly oldTypeId?: string;

  /** The new type ID (for additions/modifications) */
  readonly newTypeId?: string;

  /** Timestamp of the change */
  readonly timestamp: number;

  /** Source location of the change */
  readonly location: ChangeLocation;
}

/**
 * Kind of code change
 */
export type ChangeKind =
  | 'add' // New symbol added
  | 'modify' // Existing symbol modified
  | 'delete' // Symbol deleted
  | 'rename' // Symbol renamed
  | 'move'; // Symbol moved to different location

/**
 * Location of a change in source code
 */
export interface ChangeLocation {
  readonly startLine: number;
  readonly startColumn: number;
  readonly endLine: number;
  readonly endColumn: number;
}

/**
 * A node in the dependency graph
 */
export interface DependencyNode {
  /** Symbol ID */
  readonly symbolId: string;

  /** File where the symbol is defined */
  readonly file: string;

  /** Symbols that this symbol depends on */
  readonly dependencies: ReadonlySet<string>;

  /** Symbols that depend on this symbol */
  readonly dependents: ReadonlySet<string>;

  /** Kind of dependencies */
  readonly dependencyKinds: ReadonlyMap<string, DependencyKind>;

  /** Last update timestamp */
  readonly lastUpdated: number;

  /** Whether this node needs re-inference */
  readonly dirty: boolean;
}

/**
 * Kind of dependency relationship
 */
export type DependencyKind =
  | 'type-reference' // Uses type from another symbol
  | 'value-reference' // References value from another symbol
  | 'extends' // Extends a class/interface
  | 'implements' // Implements an interface
  | 'parameter' // Function parameter type
  | 'return' // Function return type
  | 'property' // Property type
  | 'generic-constraint' // Generic type constraint
  | 'import'; // Module import

/**
 * Result of propagating an update through the dependency graph
 */
export interface PropagationResult {
  /** The original delta that triggered propagation */
  readonly trigger: UpdateDelta;

  /** Symbols that were directly affected */
  readonly directlyAffected: readonly string[];

  /** Symbols that were transitively affected */
  readonly transitivelyAffected: readonly string[];

  /** Total number of affected symbols */
  readonly totalAffected: number;

  /** Symbols that need re-inference */
  readonly needsReInference: readonly string[];

  /** Time taken for propagation (ms) */
  readonly propagationTimeMs: number;
}

/**
 * Options for update operations
 */
export interface UpdateOptions {
  /** Maximum propagation depth */
  readonly maxDepth: number;

  /** Whether to eagerly re-infer affected symbols */
  readonly eagerReInference: boolean;

  /** Minimum confidence change to trigger re-inference */
  readonly minConfidenceChange: number;

  /** Whether to track propagation metrics */
  readonly trackMetrics: boolean;
}

/**
 * Statistics about the incremental updater
 */
export interface UpdaterStats {
  /** Total number of tracked symbols */
  readonly symbolCount: number;

  /** Total number of dependencies */
  readonly dependencyCount: number;

  /** Number of dirty (needs update) symbols */
  readonly dirtyCount: number;

  /** Average fanout (dependents per symbol) */
  readonly averageFanout: number;

  /** Maximum fanout */
  readonly maxFanout: number;

  /** Total updates processed */
  readonly totalUpdates: number;

  /** Total propagation events */
  readonly totalPropagations: number;
}
