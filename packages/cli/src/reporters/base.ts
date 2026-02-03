/**
 * Base Reporter
 *
 * Abstract base class for output reporters.
 */

import type { FileResult, AnalysisSummary, CLIOptions } from '../types.js';

/**
 * Abstract reporter base class
 */
export abstract class Reporter {
  /**
   * Report analysis results
   */
  abstract report(
    results: readonly FileResult[],
    summary: AnalysisSummary,
    options: CLIOptions
  ): Promise<void>;

  /**
   * Format a single file result
   */
  abstract formatFileResult(result: FileResult): string;
}
