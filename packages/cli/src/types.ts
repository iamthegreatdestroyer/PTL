/**
 * CLI Types
 *
 * Type definitions for CLI commands and options.
 */

import type { PTLConfig } from '@ptl/config';
import type { InferenceResult, DiagnosticMessage } from '@ptl/core';

/**
 * CLI-wide options
 */
export interface CLIOptions {
  /**
   * Path to config file
   */
  readonly config?: string;

  /**
   * Enable verbose output
   */
  readonly verbose: boolean;

  /**
   * Output format
   */
  readonly format: 'text' | 'json' | 'sarif';

  /**
   * Suppress non-error output
   */
  readonly quiet: boolean;

  /**
   * Enable color output
   */
  readonly color: boolean;
}

/**
 * Result of a CLI command
 */
export interface CommandResult {
  /**
   * Exit code (0 = success)
   */
  readonly exitCode: number;

  /**
   * Diagnostic messages
   */
  readonly diagnostics: readonly DiagnosticMessage[];

  /**
   * Summary message
   */
  readonly summary: string;

  /**
   * Inference results (if applicable)
   */
  readonly results?: readonly InferenceResult[];
}

/**
 * Options for the analyze command
 */
export interface AnalyzeOptions extends CLIOptions {
  /**
   * Files or globs to analyze
   */
  readonly files: readonly string[];

  /**
   * Include node_modules
   */
  readonly includeNodeModules: boolean;

  /**
   * Maximum depth for inference
   */
  readonly maxDepth: number;

  /**
   * Confidence threshold for reporting
   */
  readonly threshold: number;

  /**
   * Output file path
   */
  readonly output?: string;
}

/**
 * Options for the check command
 */
export interface CheckOptions extends CLIOptions {
  /**
   * Files or globs to check
   */
  readonly files: readonly string[];

  /**
   * Strict mode (all inferences must have high confidence)
   */
  readonly strict: boolean;

  /**
   * Minimum confidence threshold
   */
  readonly minConfidence: number;

  /**
   * Fail on warnings
   */
  readonly failOnWarnings: boolean;
}

/**
 * Options for the watch command
 */
export interface WatchOptions extends CLIOptions {
  /**
   * Files or globs to watch
   */
  readonly files: readonly string[];

  /**
   * Debounce delay (ms)
   */
  readonly debounce: number;

  /**
   * Run initial analysis
   */
  readonly initial: boolean;

  /**
   * Clear console on each run
   */
  readonly clear: boolean;
}

/**
 * Options for the init command
 */
export interface InitOptions extends CLIOptions {
  /**
   * Target directory
   */
  readonly directory: string;

  /**
   * Overwrite existing config
   */
  readonly force: boolean;

  /**
   * Preset configuration
   */
  readonly preset: 'minimal' | 'standard' | 'strict';
}

/**
 * File analysis result for reporting
 */
export interface FileResult {
  /**
   * File path
   */
  readonly path: string;

  /**
   * Inference results
   */
  readonly inferences: readonly InferenceResult[];

  /**
   * Diagnostics for this file
   */
  readonly diagnostics: readonly DiagnosticMessage[];

  /**
   * Analysis time (ms)
   */
  readonly duration: number;
}

/**
 * Analysis summary statistics
 */
export interface AnalysisSummary {
  /**
   * Total files analyzed
   */
  readonly filesAnalyzed: number;

  /**
   * Total inferences made
   */
  readonly totalInferences: number;

  /**
   * High confidence inferences
   */
  readonly highConfidence: number;

  /**
   * Medium confidence inferences
   */
  readonly mediumConfidence: number;

  /**
   * Low confidence inferences
   */
  readonly lowConfidence: number;

  /**
   * Number of errors
   */
  readonly errors: number;

  /**
   * Number of warnings
   */
  readonly warnings: number;

  /**
   * Total duration (ms)
   */
  readonly duration: number;
}
