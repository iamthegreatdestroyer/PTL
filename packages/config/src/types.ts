/**
 * Configuration Types
 *
 * Type definitions for PTL configuration.
 */

import type { Result } from '@ptl/shared';

/**
 * Type lattice configuration
 */
export interface LatticeConfig {
  /**
   * Include TypeScript standard library types
   * @default true
   */
  readonly includeStdlib: boolean;

  /**
   * Include DOM types
   * @default false
   */
  readonly includeDom: boolean;

  /**
   * Maximum lattice depth for type hierarchies
   * @default 15
   */
  readonly maxDepth: number;

  /**
   * Custom type definitions to include
   */
  readonly customTypes?: ReadonlyArray<{
    readonly name: string;
    readonly supertypes?: readonly string[];
    readonly subtypes?: readonly string[];
  }>;
}

/**
 * Bayesian inference configuration
 */
export interface BayesianConfig {
  /**
   * Default Dirichlet prior alpha (concentration parameter)
   * Higher = stronger prior, slower learning from evidence
   * @default 1.0
   */
  readonly defaultAlpha: number;

  /**
   * Laplace smoothing factor
   * Prevents zero probabilities
   * @default 0.1
   */
  readonly smoothing: number;

  /**
   * Minimum confidence threshold for type inference
   * @default 0.6
   */
  readonly minConfidence: number;

  /**
   * Maximum number of type alternatives to track
   * @default 5
   */
  readonly maxAlternatives: number;

  /**
   * Use type priors from pre-trained data
   * @default true
   */
  readonly useTypePriors: boolean;

  /**
   * Path to custom type priors file
   */
  readonly priorsPath?: string;
}

/**
 * Incremental analysis configuration
 */
export interface IncrementalConfig {
  /**
   * Enable incremental mode
   * @default true
   */
  readonly enabled: boolean;

  /**
   * Maximum depth for propagating type changes
   * @default 3
   */
  readonly maxPropagationDepth: number;

  /**
   * Debounce delay for file changes (ms)
   * @default 100
   */
  readonly debounceDelay: number;

  /**
   * Enable dependency tracking
   * @default true
   */
  readonly trackDependencies: boolean;
}

/**
 * Analyzer configuration
 */
export interface AnalyzerConfig {
  /**
   * File patterns to include
   * @default ["**\/*.ts", "**\/*.tsx"]
   */
  readonly include: readonly string[];

  /**
   * File patterns to exclude
   * @default ["**\/node_modules\/**", "**\/dist\/**", "**\/*.d.ts"]
   */
  readonly exclude: readonly string[];

  /**
   * Analyze private class members
   * @default false
   */
  readonly includePrivate: boolean;

  /**
   * Maximum file size to analyze (bytes)
   * @default 1048576 (1MB)
   */
  readonly maxFileSize: number;

  /**
   * Parse JSDoc comments for type hints
   * @default true
   */
  readonly parseJsDoc: boolean;
}

/**
 * Output configuration
 */
export interface OutputConfig {
  /**
   * Output format
   * @default "json"
   */
  readonly format: 'json' | 'sarif' | 'text' | 'markdown';

  /**
   * Output file path (stdout if not specified)
   */
  readonly file?: string;

  /**
   * Include source code snippets
   * @default true
   */
  readonly includeSnippets: boolean;

  /**
   * Maximum number of type alternatives to show
   * @default 3
   */
  readonly maxAlternatives: number;

  /**
   * Show confidence intervals
   * @default true
   */
  readonly showConfidenceIntervals: boolean;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /**
   * Enable caching
   * @default true
   */
  readonly enabled: boolean;

  /**
   * Cache directory path
   * @default ".ptl-cache"
   */
  readonly directory: string;

  /**
   * Cache TTL in seconds
   * @default 86400 (24 hours)
   */
  readonly ttl: number;

  /**
   * Maximum cache size in bytes
   * @default 104857600 (100MB)
   */
  readonly maxSize: number;
}

/**
 * Complete PTL configuration
 */
export interface PTLConfig {
  /**
   * Configuration version
   */
  readonly version: 1;

  /**
   * Project root directory
   */
  readonly root: string;

  /**
   * Path to tsconfig.json
   */
  readonly tsconfig?: string;

  /**
   * Type lattice configuration
   */
  readonly lattice: LatticeConfig;

  /**
   * Bayesian inference configuration
   */
  readonly bayesian: BayesianConfig;

  /**
   * Incremental analysis configuration
   */
  readonly incremental: IncrementalConfig;

  /**
   * Analyzer configuration
   */
  readonly analyzer: AnalyzerConfig;

  /**
   * Output configuration
   */
  readonly output: OutputConfig;

  /**
   * Cache configuration
   */
  readonly cache: CacheConfig;
}

/**
 * Partial configuration (for user-specified overrides)
 */
export type PartialPTLConfig = {
  readonly [K in keyof Omit<PTLConfig, 'version' | 'root'>]?: K extends keyof PTLConfig
    ? PTLConfig[K] extends object
      ? Partial<PTLConfig[K]>
      : PTLConfig[K]
    : never;
} & {
  readonly version?: 1;
  readonly root?: string;
  readonly tsconfig?: string;
};

/**
 * Configuration loading result
 */
export interface ConfigLoadResult {
  /**
   * Resolved configuration
   */
  readonly config: PTLConfig;

  /**
   * Path to config file (if loaded from file)
   */
  readonly configPath?: string;

  /**
   * Warnings from config loading
   */
  readonly warnings: readonly string[];
}

/**
 * Configuration validation error
 */
export interface ConfigValidationError {
  /**
   * Error path (e.g., "bayesian.minConfidence")
   */
  readonly path: string;

  /**
   * Error message
   */
  readonly message: string;

  /**
   * Invalid value
   */
  readonly value?: unknown;
}

/**
 * Configuration validation result
 */
export type ConfigValidationResult = Result<PTLConfig, readonly ConfigValidationError[]>;
