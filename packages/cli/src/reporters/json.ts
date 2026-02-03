/**
 * JSON Reporter
 *
 * Machine-readable JSON output.
 */

import { Reporter } from './base.js';
import type { FileResult, AnalysisSummary, CLIOptions } from '../types.js';

/**
 * JSON output reporter
 */
export class JsonReporter extends Reporter {
  async report(
    results: readonly FileResult[],
    summary: AnalysisSummary,
    options: CLIOptions
  ): Promise<void> {
    const output = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      summary: {
        filesAnalyzed: summary.filesAnalyzed,
        totalInferences: summary.totalInferences,
        confidence: {
          high: summary.highConfidence,
          medium: summary.mediumConfidence,
          low: summary.lowConfidence,
        },
        issues: {
          errors: summary.errors,
          warnings: summary.warnings,
        },
        duration: summary.duration,
      },
      files: results.map((r) => ({
        path: r.path,
        duration: r.duration,
        inferences: r.inferences.map((i) => ({
          type: i.type,
          confidence: i.confidence,
          confidenceInterval: i.confidenceInterval,
          location: i.location,
        })),
        diagnostics: r.diagnostics.map((d) => ({
          severity: d.severity,
          message: d.message,
          location: d.location,
        })),
      })),
    };

    console.log(JSON.stringify(output, null, 2));
  }

  formatFileResult(result: FileResult): string {
    return JSON.stringify(
      {
        path: result.path,
        duration: result.duration,
        inferences: result.inferences,
        diagnostics: result.diagnostics,
      },
      null,
      2
    );
  }
}
