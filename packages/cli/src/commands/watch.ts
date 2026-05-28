/**
 * Watch Command
 *
 * Watch files and re-analyze on changes.
 */

import { watch } from 'node:fs';
import { dirname } from 'node:path';
import { glob } from 'glob';
import ora from 'ora';
import chalk from 'chalk';

import type { WatchOptions, CommandResult } from '../types.js';
import { analyzeCommand } from './analyze.js';

/**
 * Execute the watch command
 */
export async function watchCommand(options: WatchOptions): Promise<CommandResult> {
  const spinner = ora({ isSilent: options.quiet });

  try {
    spinner.start('Loading configuration...');
    spinner.succeed('Configuration loaded');

    // Resolve files to watch
    spinner.start('Resolving files...');
    const files = await resolveFiles(options.files);

    if (files.length === 0) {
      spinner.warn('No files found to watch');
      return {
        exitCode: 0,
        diagnostics: [],
        summary: 'No files found to watch',
      };
    }

    spinner.succeed(`Watching ${files.length} file(s)`);

    // Initial analysis
    if (options.initial) {
      if (options.clear) {
        console.clear();
      }
      console.log(chalk.cyan('\n--- Initial analysis ---\n'));
      await runAnalysis(options);
    }

    // Set up file watchers
    const watchers = new Map<string, ReturnType<typeof watch>>();
    let debounceTimer: NodeJS.Timeout | null = null;

    const directories = new Set(files.map((f) => dirname(f)));

    for (const dir of directories) {
      const watcher = watch(dir, { recursive: true }, async (_eventType, filename) => {
        if (!filename?.endsWith('.ts') && !filename?.endsWith('.tsx')) {
          return;
        }

        // Debounce
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(async () => {
          if (options.clear) {
            console.clear();
          }

          console.log(chalk.cyan(`\n--- File changed: ${filename} ---\n`));
          await runAnalysis(options);
        }, options.debounce);
      });

      watchers.set(dir, watcher);
    }

    console.log('');
    console.log(chalk.green('Watching for changes... Press Ctrl+C to stop'));
    console.log('');

    // Keep process alive
    await new Promise<void>((resolve) => {
      process.on('SIGINT', () => {
        console.log('\n');
        spinner.start('Stopping watchers...');

        for (const watcher of watchers.values()) {
          watcher.close();
        }

        spinner.succeed('Stopped watching');
        resolve();
      });
    });

    return {
      exitCode: 0,
      diagnostics: [],
      summary: 'Watch mode ended',
    };
  } catch (error) {
    spinner.fail('Watch failed');
    throw error;
  }
}

/**
 * Run analysis on watched files
 */
async function runAnalysis(options: WatchOptions): Promise<void> {
  try {
    const base = {
      files: options.files,
      includeNodeModules: false,
      maxDepth: 10,
      threshold: 0.5,
      verbose: options.verbose,
      format: options.format,
      quiet: false as const,
      color: options.color,
    };
    await analyzeCommand(
      options.config !== undefined ? { ...base, config: options.config } : base
    );
  } catch (error) {
    console.error(chalk.red('Analysis failed:'), error);
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
