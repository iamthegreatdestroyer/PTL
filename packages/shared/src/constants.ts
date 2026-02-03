/**
 * Shared Constants
 *
 * Common constants used across all PTL packages.
 *
 * @packageDocumentation
 */

// =============================================================================
// Version Information
// =============================================================================

/** Current PTL version */
export const PTL_VERSION = '0.0.1';

/** Minimum supported Node.js version */
export const MIN_NODE_VERSION = '20.0.0';

/** Minimum supported TypeScript version */
export const MIN_TS_VERSION = '5.0.0';

// =============================================================================
// File Patterns
// =============================================================================

/** Default file patterns to include in analysis */
export const DEFAULT_INCLUDE_PATTERNS = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.mts',
  '**/*.cts',
] as const;

/** Default file patterns to exclude from analysis */
export const DEFAULT_EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/coverage/**',
  '**/*.d.ts',
  '**/*.test.ts',
  '**/*.spec.ts',
  '**/__tests__/**',
  '**/__mocks__/**',
] as const;

// =============================================================================
// Configuration File Names
// =============================================================================

/** PTL configuration file names (in order of precedence) */
export const CONFIG_FILE_NAMES = [
  'ptl.config.ts',
  'ptl.config.mts',
  'ptl.config.js',
  'ptl.config.mjs',
  'ptl.config.json',
  '.ptlrc.json',
  '.ptlrc',
] as const;

/** PTL prior data file name */
export const PRIOR_DATA_FILE = 'ptl-priors.json';

/** PTL cache directory name */
export const CACHE_DIR_NAME = '.ptl-cache';

// =============================================================================
// Type System Constants
// =============================================================================

/** Top type (supertype of all types) */
export const TOP_TYPE = '⊤' as const;

/** Bottom type (subtype of all types) */
export const BOTTOM_TYPE = '⊥' as const;

/** Unknown type */
export const UNKNOWN_TYPE = 'unknown' as const;

/** Never type */
export const NEVER_TYPE = 'never' as const;

/** Any type */
export const ANY_TYPE = 'any' as const;

/** Void type */
export const VOID_TYPE = 'void' as const;

/** Undefined type */
export const UNDEFINED_TYPE = 'undefined' as const;

/** Null type */
export const NULL_TYPE = 'null' as const;

// =============================================================================
// Primitive Types
// =============================================================================

/** Primitive type names */
export const PRIMITIVE_TYPES = [
  'string',
  'number',
  'boolean',
  'bigint',
  'symbol',
  'undefined',
  'null',
] as const;

/** Literal type kinds */
export const LITERAL_TYPE_KINDS = [
  'string-literal',
  'number-literal',
  'boolean-literal',
  'bigint-literal',
] as const;

// =============================================================================
// Inference Thresholds
// =============================================================================

/** Default confidence threshold for reporting types */
export const DEFAULT_MIN_CONFIDENCE = 0.5;

/** High confidence threshold */
export const HIGH_CONFIDENCE_THRESHOLD = 0.9;

/** Medium confidence threshold */
export const MEDIUM_CONFIDENCE_THRESHOLD = 0.7;

/** Low confidence threshold */
export const LOW_CONFIDENCE_THRESHOLD = 0.5;

// =============================================================================
// Bayesian Constants
// =============================================================================

/** Default alpha for Dirichlet prior (uniform) */
export const DEFAULT_DIRICHLET_ALPHA = 1.0;

/** Minimum alpha value to prevent numerical issues */
export const MIN_DIRICHLET_ALPHA = 1e-10;

/** Default smoothing factor */
export const DEFAULT_SMOOTHING = 0.1;

/** Default confidence interval alpha */
export const DEFAULT_CI_ALPHA = 0.05;

// =============================================================================
// Incremental Update Constants
// =============================================================================

/** Maximum depth for dependency propagation */
export const MAX_PROPAGATION_DEPTH = 100;

/** Maximum number of deltas to queue before flush */
export const MAX_QUEUED_DELTAS = 1000;

/** Minimum confidence change to trigger re-inference */
export const MIN_CONFIDENCE_CHANGE = 0.01;

// =============================================================================
// Performance Limits
// =============================================================================

/** Maximum number of type alternatives to compute */
export const MAX_TYPE_ALTERNATIVES = 10;

/** Maximum lattice depth for traversal */
export const MAX_LATTICE_DEPTH = 50;

/** Maximum number of symbols per file */
export const MAX_SYMBOLS_PER_FILE = 10000;

/** Maximum file size to analyze (bytes) */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// =============================================================================
// Diagnostic Codes
// =============================================================================

/** Diagnostic code prefixes */
export const DIAGNOSTIC_PREFIX = {
  /** Parsing errors */
  PARSE: 'PTL1',
  /** Type errors */
  TYPE: 'PTL2',
  /** Configuration errors */
  CONFIG: 'PTL3',
  /** Internal errors */
  INTERNAL: 'PTL9',
} as const;

// =============================================================================
// Exit Codes
// =============================================================================

/** CLI exit codes */
export const EXIT_CODES = {
  /** Success */
  SUCCESS: 0,
  /** Type errors found */
  TYPE_ERRORS: 1,
  /** Configuration error */
  CONFIG_ERROR: 2,
  /** Internal error */
  INTERNAL_ERROR: 3,
} as const;
