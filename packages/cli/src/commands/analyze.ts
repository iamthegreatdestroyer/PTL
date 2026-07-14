/**
 * Analyze Command
 *
 * Analyzes TypeScript files and infers types with confidence intervals.
 */

import { readFile } from 'node:fs/promises';
import { glob } from 'glob';
import ora from 'ora';
import chalk from 'chalk';

import type { AnalyzeOptions, CommandResult, FileResult, AnalysisSummary } from '../types.js';
import { ConsoleReporter, JsonReporter } from '../reporters/index.js';
import { createCoreAdapter } from '../adapters/core-adapter.js';

/**
 * Execute the analyze command
 */
export async function analyzeCommand(options: AnalyzeOptions): Promise<CommandResult> {
  const spinner = ora({ isSilent: options.quiet });

  try {
    spinner.start('Loading configuration...');
    spinner.succeed('Configuration loaded');

    // Resolve file patterns
    spinner.start('Resolving files...');
    const files = await resolveFiles(options.files, {
      includeNodeModules: options.includeNodeModules,
      cwd: process.cwd(),
    });

    if (files.length === 0) {
      spinner.warn('No files found to analyze');
      return {
        exitCode: 0,
        diagnostics: [],
        summary: 'No files found to analyze',
      };
    }

    spinner.succeed(`Found ${files.length} file(s) to analyze`);

    // Load execution traces if provided
    if (options.traces !== undefined) {
      spinner.start('Loading execution traces...');
      await readFile(options.traces, 'utf-8'); // validates file is readable
      // NOTE: --traces is parsed and the file is validated, but traces are NOT
      // yet wired into the Bayesian inference engine. Warn instead of implying
      // they influenced the analysis.
      spinner.warn('--traces is not yet applied (trace-guided inference is not implemented)');
    }

    // Analyze files
    spinner.start('Analyzing files...');
    const startTime = Date.now();
    const adapter = createCoreAdapter({ minConfidence: options.threshold });

    const results = await adapter.analyzeFiles(files);

    const duration = Date.now() - startTime;
    spinner.succeed(`Analysis complete in ${duration}ms`);

    // Compute summary
    const summary = computeSummary(results, duration);

    // Output results
    const reporter =
      options.format === 'json'
        ? new JsonReporter()
        : new ConsoleReporter({ color: options.color, verbose: options.verbose });

    await reporter.report(results, summary, options);

    // Determine exit code
    const exitCode = summary.errors > 0 ? 1 : 0;

    return {
      exitCode,
      diagnostics: results.flatMap((r) => r.diagnostics),
      summary: formatSummaryMessage(summary),
      results: results.flatMap((r) => r.inferences),
    };
  } catch (error) {
    spinner.fail('Analysis failed');
    throw error;
  }
}

/**
 * Resolve file patterns to actual file paths
 */
async function resolveFiles(
  patterns: readonly string[],
  options: { includeNodeModules: boolean; cwd: string }
): Promise<string[]> {
  const allFiles: string[] = [];

  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: options.cwd,
      ignore: options.includeNodeModules ? [] : ['**/node_modules/**'],
      absolute: true,
      nodir: true,
    });

    // Filter to TypeScript files
    const tsFiles = matches.filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));

    allFiles.push(...tsFiles);
  }

  // Deduplicate
  return [...new Set(allFiles)];
}

/**
 * Compute analysis summary
 */
function computeSummary(results: readonly FileResult[], duration: number): AnalysisSummary {
  let totalInferences = 0;
  let highConfidence = 0;
  let mediumConfidence = 0;
  let lowConfidence = 0;
  let errors = 0;
  let warnings = 0;

  for (const result of results) {
    for (const inference of result.inferences) {
      totalInferences++;
      const confidence = inference.confidence;

      if (confidence >= 0.8) {
        highConfidence++;
      } else if (confidence >= 0.5) {
        mediumConfidence++;
      } else {
        lowConfidence++;
      }
    }

    for (const diag of result.diagnostics) {
      if (diag.severity === 'error') {
        errors++;
      } else if (diag.severity === 'warning') {
        warnings++;
      }
    }
  }

  return {
    filesAnalyzed: results.length,
    totalInferences,
    highConfidence,
    mediumConfidence,
    lowConfidence,
    errors,
    warnings,
    duration,
  };
}

/**
 * Format summary message for display
 */
function formatSummaryMessage(summary: AnalysisSummary): string {
  const parts: string[] = [];

  parts.push(`Analyzed ${summary.filesAnalyzed} file(s)`);
  parts.push(`${summary.totalInferences} type inference(s)`);

  if (summary.highConfidence > 0) {
    parts.push(chalk.green(`${summary.highConfidence} high confidence`));
  }
  if (summary.mediumConfidence > 0) {
    parts.push(chalk.yellow(`${summary.mediumConfidence} medium confidence`));
  }
  if (summary.lowConfidence > 0) {
    parts.push(chalk.red(`${summary.lowConfidence} low confidence`));
  }

  if (summary.errors > 0) {
    parts.push(chalk.red(`${summary.errors} error(s)`));
  }
  if (summary.warnings > 0) {
    parts.push(chalk.yellow(`${summary.warnings} warning(s)`));
  }

  parts.push(`in ${summary.duration}ms`);

  return parts.join(' | ');
}
