/**
 * Console Reporter
 *
 * Human-readable console output.
 */

import chalk from 'chalk';
import figures from 'figures';

import { Reporter } from './base.js';
import type { FileResult, AnalysisSummary, CLIOptions } from '../types.js';

export interface ConsoleReporterOptions {
  readonly color: boolean;
  readonly verbose: boolean;
}

/**
 * Console output reporter
 */
export class ConsoleReporter extends Reporter {
  private readonly options: ConsoleReporterOptions;

  constructor(options: Partial<ConsoleReporterOptions> = {}) {
    super();
    this.options = {
      color: options.color ?? true,
      verbose: options.verbose ?? false,
    };
  }

  async report(
    results: readonly FileResult[],
    summary: AnalysisSummary,
    _options: CLIOptions
  ): Promise<void> {
    // File results
    for (const result of results) {
      if (result.diagnostics.length > 0 || this.options.verbose) {
        console.log(this.formatFileResult(result));
      }
    }

    // Summary
    console.log('');
    console.log(this.formatSummary(summary));
    console.log('');
  }

  formatFileResult(result: FileResult): string {
    const lines: string[] = [];
    const c = this.options.color
      ? chalk
      : {
          cyan: (s: string) => s,
          red: (s: string) => s,
          yellow: (s: string) => s,
          green: (s: string) => s,
          gray: (s: string) => s,
        };

    lines.push(c.cyan(result.path));

    for (const diag of result.diagnostics) {
      const icon =
        diag.severity === 'error'
          ? c.red(figures.cross)
          : diag.severity === 'warning'
            ? c.yellow(figures.warning)
            : c.green(figures.info);

      const location = diag.location ? `${diag.location.line}:${diag.location.column}` : '';

      lines.push(`  ${icon} ${location} ${diag.message}`);
    }

    for (const inference of result.inferences) {
      const confidence = inference.confidence;
      const typeName = inference.type;
      const confidenceStr = `${Math.round(confidence * 100)}%`;

      const color = confidence >= 0.8 ? c.green : confidence >= 0.5 ? c.yellow : c.red;

      const icon =
        confidence >= 0.8 ? figures.tick : confidence >= 0.5 ? figures.warning : figures.cross;

      if (this.options.verbose || confidence < 0.8) {
        lines.push(`  ${color(icon)} ${typeName} (${color(confidenceStr)})`);
      }
    }

    return lines.join('\n');
  }

  private formatSummary(summary: AnalysisSummary): string {
    const c = this.options.color
      ? chalk
      : {
          bold: (s: string) => s,
          green: (s: string) => s,
          yellow: (s: string) => s,
          red: (s: string) => s,
          gray: (s: string) => s,
        };

    const lines: string[] = [];

    lines.push(c.bold('Summary:'));
    lines.push(`  Files analyzed: ${summary.filesAnalyzed}`);
    lines.push(`  Total inferences: ${summary.totalInferences}`);

    if (summary.highConfidence > 0) {
      lines.push(`  ${c.green(figures.tick)} High confidence: ${summary.highConfidence}`);
    }
    if (summary.mediumConfidence > 0) {
      lines.push(`  ${c.yellow(figures.warning)} Medium confidence: ${summary.mediumConfidence}`);
    }
    if (summary.lowConfidence > 0) {
      lines.push(`  ${c.red(figures.cross)} Low confidence: ${summary.lowConfidence}`);
    }

    lines.push('');

    if (summary.errors > 0) {
      lines.push(c.red(`  ${figures.cross} ${summary.errors} error(s)`));
    }
    if (summary.warnings > 0) {
      lines.push(c.yellow(`  ${figures.warning} ${summary.warnings} warning(s)`));
    }
    if (summary.errors === 0 && summary.warnings === 0) {
      lines.push(c.green(`  ${figures.tick} No issues found`));
    }

    lines.push(c.gray(`  Duration: ${summary.duration}ms`));

    return lines.join('\n');
  }
}
