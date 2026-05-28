/**
 * Check Command
 *
 * Check types and report low-confidence inferences.
 */

import ora from 'ora';
import chalk from 'chalk';
import { glob } from 'glob';

import type { CheckOptions, CommandResult } from '../types.js';
import { createCoreAdapter } from '../adapters/core-adapter.js';

/**
 * Execute the check command
 */
export async function checkCommand(options: CheckOptions): Promise<CommandResult> {
  const spinner = ora({ isSilent: options.quiet });

  try {
    spinner.start('Loading configuration...');
    spinner.succeed('Configuration loaded');

    // Resolve files
    spinner.start('Resolving files...');
    const files = await resolveFiles(options.files);

    if (files.length === 0) {
      spinner.warn('No files found to check');
      return {
        exitCode: 0,
        diagnostics: [],
        summary: 'No files found to check',
      };
    }

    spinner.succeed(`Found ${files.length} file(s) to check`);

    // Check files
    spinner.start('Checking types...');
    const startTime = Date.now();

    // Create adapter and analyze files
    const adapter = createCoreAdapter({
      minConfidence: options.minConfidence,
    });

    const results = await adapter.analyzeFiles(files);

    // Apply stricter checks
    let errorCount = 0;
    let warningCount = 0;
    let lowConfidenceCount = 0;
    const allDiagnostics: any[] = [];

    for (const result of results) {
      const checked = adapter.checkFile(result, options.minConfidence);

      // Count diagnostics
      for (const diag of checked.diagnostics) {
        allDiagnostics.push(diag);
        if (diag.severity === 'error') {
          errorCount++;
        } else if (diag.severity === 'warning') {
          warningCount++;
        }
      }

      // Count low-confidence inferences in strict mode
      if (options.strict) {
        for (const inference of result.inferences) {
          if (inference.confidence < options.minConfidence) {
            lowConfidenceCount++;
          }
        }
      }
    }

    const duration = Date.now() - startTime;

    if (errorCount === 0 && warningCount === 0) {
      spinner.succeed(chalk.green(`All types check passed in ${duration}ms`));
    } else {
      spinner.warn(`Found ${errorCount} error(s), ${warningCount} warning(s) in ${duration}ms`);
    }

    // Determine exit code
    let exitCode = 0;
    if (errorCount > 0) {
      exitCode = 1;
    } else if (options.failOnWarnings && warningCount > 0) {
      exitCode = 1;
    } else if (options.strict && lowConfidenceCount > 0) {
      exitCode = 1;
    }

    const summary = [
      `Checked ${files.length} file(s)`,
      errorCount > 0 ? chalk.red(`${errorCount} error(s)`) : null,
      warningCount > 0 ? chalk.yellow(`${warningCount} warning(s)`) : null,
      lowConfidenceCount > 0 ? chalk.cyan(`${lowConfidenceCount} low-confidence type(s)`) : null,
      `in ${duration}ms`,
    ]
      .filter(Boolean)
      .join(' | ');

    return {
      exitCode,
      diagnostics: allDiagnostics,
      summary,
    };
  } catch (error) {
    spinner.fail('Check failed');
    throw error;
  }
}

/**
 * Resolve file patterns
 */
async function resolveFiles(patterns: readonly string[]): Promise<string[]> {
  const allFiles: string[] = [];

  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: process.cwd(),
      ignore: ['**/node_modules/**'],
      absolute: true,
      nodir: true,
    });

    const tsFiles = matches.filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));

    allFiles.push(...tsFiles);
  }

  return [...new Set(allFiles)];
}
