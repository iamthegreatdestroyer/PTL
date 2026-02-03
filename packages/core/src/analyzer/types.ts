/**
 * Type definitions for the analyzer module
 */

import type { TypeBelief, InferenceResult } from '../bayesian/types.js';
import type { TypeNode } from '../lattice/types.js';

/**
 * Configuration for the analyzer
 */
export interface AnalyzerConfig {
  /** Root directory to analyze */
  readonly rootDir: string;

  /** File patterns to include */
  readonly include: readonly string[];

  /** File patterns to exclude */
  readonly exclude: readonly string[];

  /** Whether to use strict mode (like TypeScript strict) */
  readonly strict: boolean;

  /** Whether to include node_modules */
  readonly includeNodeModules: boolean;

  /** Minimum confidence to report a type */
  readonly minConfidence: number;

  /** Maximum number of type alternatives to show */
  readonly maxAlternatives: number;

  /** Whether to use empirical priors from prior data */
  readonly useEmpiricalPriors: boolean;

  /** Path to prior data file */
  readonly priorDataPath?: string;

  /** Whether to enable incremental mode */
  readonly incremental: boolean;

  /** Path to cache directory for incremental mode */
  readonly cacheDir?: string;
}

/**
 * Result of analyzing an entire project
 */
export interface AnalysisResult {
  /** Root directory that was analyzed */
  readonly rootDir: string;

  /** Files that were analyzed */
  readonly files: readonly FileAnalysisResult[];

  /** Total number of symbols analyzed */
  readonly totalSymbols: number;

  /** Number of symbols with high confidence types */
  readonly highConfidenceSymbols: number;

  /** Number of symbols with medium confidence types */
  readonly mediumConfidenceSymbols: number;

  /** Number of symbols with low confidence types */
  readonly lowConfidenceSymbols: number;

  /** Overall average confidence */
  readonly averageConfidence: number;

  /** Analysis duration in milliseconds */
  readonly durationMs: number;

  /** Any errors encountered */
  readonly errors: readonly AnalysisError[];

  /** Warnings generated */
  readonly warnings: readonly AnalysisWarning[];

  /** Statistics about the analysis */
  readonly stats: AnalysisStats;
}

/**
 * Result of analyzing a single file
 */
export interface FileAnalysisResult {
  /** File path */
  readonly file: string;

  /** Symbols found in the file */
  readonly symbols: readonly SymbolInfo[];

  /** Number of symbols */
  readonly symbolCount: number;

  /** Average confidence for this file */
  readonly averageConfidence: number;

  /** Errors in this file */
  readonly errors: readonly AnalysisError[];

  /** Duration to analyze this file (ms) */
  readonly durationMs: number;
}

/**
 * Information about a symbol
 */
export interface SymbolInfo {
  /** Unique symbol ID */
  readonly id: string;

  /** Symbol name */
  readonly name: string;

  /** Symbol kind */
  readonly kind: SymbolKind;

  /** File where the symbol is defined */
  readonly file: string;

  /** Location in source */
  readonly location: SymbolLocation;

  /** Inference result for this symbol */
  readonly inference: InferenceResult;

  /** Most likely type */
  readonly type: TypeNode;

  /** Confidence in the most likely type */
  readonly confidence: number;

  /** Alternative types with their probabilities */
  readonly alternatives: readonly TypeAlternative[];

  /** JSDoc or other documentation */
  readonly documentation?: string;

  /** Whether this symbol is exported */
  readonly exported: boolean;

  /** Parent symbol (for methods, properties) */
  readonly parent?: string;
}

/**
 * Kind of symbol
 */
export type SymbolKind =
  | 'variable'
  | 'function'
  | 'class'
  | 'interface'
  | 'type-alias'
  | 'enum'
  | 'namespace'
  | 'module'
  | 'parameter'
  | 'property'
  | 'method'
  | 'getter'
  | 'setter'
  | 'constructor'
  | 'index-signature';

/**
 * Location of a symbol in source code
 */
export interface SymbolLocation {
  readonly startLine: number;
  readonly startColumn: number;
  readonly endLine: number;
  readonly endColumn: number;
}

/**
 * An alternative type with its probability
 */
export interface TypeAlternative {
  /** The type */
  readonly type: TypeNode;

  /** Probability of this type */
  readonly probability: number;

  /** Confidence in this probability */
  readonly confidence: number;
}

/**
 * Analysis error
 */
export interface AnalysisError {
  /** Error code */
  readonly code: string;

  /** Error message */
  readonly message: string;

  /** Severity */
  readonly severity: 'error' | 'warning' | 'info';

  /** File where error occurred */
  readonly file?: string;

  /** Location of error */
  readonly location?: SymbolLocation;
}

/**
 * Analysis warning
 */
export interface AnalysisWarning {
  /** Warning code */
  readonly code: string;

  /** Warning message */
  readonly message: string;

  /** Affected symbol */
  readonly symbolId?: string;

  /** File where warning was generated */
  readonly file?: string;

  /** Location */
  readonly location?: SymbolLocation;
}

/**
 * Statistics about the analysis
 */
export interface AnalysisStats {
  /** Total files processed */
  readonly filesProcessed: number;

  /** Total symbols analyzed */
  readonly symbolsAnalyzed: number;

  /** Observations collected */
  readonly observationsCollected: number;

  /** Types in the lattice */
  readonly typesInLattice: number;

  /** Cache hits (for incremental mode) */
  readonly cacheHits: number;

  /** Cache misses */
  readonly cacheMisses: number;

  /** Time spent parsing (ms) */
  readonly parseTimeMs: number;

  /** Time spent analyzing (ms) */
  readonly analyzeTimeMs: number;

  /** Time spent inferring (ms) */
  readonly inferenceTimeMs: number;
}

/**
 * Context passed through the analysis process
 */
export interface AnalysisContext {
  /** Current file being analyzed */
  readonly currentFile: string;

  /** Current scope path (e.g., ['MyClass', 'myMethod']) */
  readonly scopePath: readonly string[];

  /** Parent symbol ID */
  readonly parentSymbol?: string;

  /** Whether we're in an exported context */
  readonly isExported: boolean;

  /** Type parameters in scope */
  readonly typeParameters: ReadonlyMap<string, TypeNode>;

  /** Local bindings in scope */
  readonly localBindings: ReadonlyMap<string, string>;
}

/**
 * Options for the analyze method
 */
export interface AnalysisOptions {
  /** Minimum confidence to include in results */
  readonly minConfidence?: number;

  /** Maximum alternatives per symbol */
  readonly maxAlternatives?: number;

  /** Whether to include private symbols */
  readonly includePrivate?: boolean;

  /** Whether to force re-analysis (ignore cache) */
  readonly forceReanalysis?: boolean;
}

/**
 * Inference result for a specific symbol
 */
export interface SymbolInference {
  /** Symbol ID */
  readonly symbolId: string;

  /** Symbol name */
  readonly name: string;

  /** Most likely type ID */
  readonly typeId: string;

  /** Confidence in the most likely type */
  readonly confidence: number;

  /** Confidence interval */
  readonly confidenceInterval: {
    readonly lower: number;
    readonly upper: number;
    readonly alpha: number;
  };

  /** Alternative types */
  readonly alternatives: ReadonlyArray<{
    readonly typeId: string;
    readonly probability: number;
  }>;

  /** Total observations for this symbol */
  readonly observationCount: number;
}
