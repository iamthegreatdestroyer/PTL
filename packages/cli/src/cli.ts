/**
 * CLI Main Module
 *
 * Creates and runs the CLI application.
 */

import { Command } from 'commander';
import chalk from 'chalk';

import { analyzeCommand } from './commands/analyze.js';
import { checkCommand } from './commands/check.js';
import { initCommand } from './commands/init.js';
import { watchCommand } from './commands/watch.js';
import { VERSION } from './version.js';

/**
 * Create the CLI program
 */
export function createCLI(): Command {
  const program = new Command();

  program
    .name('ptl')
    .description('PTL - Probabilistic Type Lattice Analyzer')
    .version(VERSION, '-v, --version', 'Display version number')
    .option('-c, --config <path>', 'Path to configuration file')
    .option('--verbose', 'Enable verbose output', false)
    .option('--format <format>', 'Output format (text, json, sarif)', 'text')
    .option('--quiet', 'Suppress non-error output', false)
    .option('--no-color', 'Disable color output');

  // Analyze command
  program
    .command('analyze [files...]')
    .description('Analyze TypeScript files and infer types with confidence intervals')
    .option('--include-node-modules', 'Include node_modules in analysis', false)
    .option('--max-depth <depth>', 'Maximum depth for inference', '10')
    .option('-t, --threshold <threshold>', 'Confidence threshold (0-1)', '0.5')
    .option('-o, --output <file>', 'Write results to file')
    .action(async (files, options) => {
      const result = await analyzeCommand({
        files: files.length > 0 ? files : ['.'],
        includeNodeModules: options.includeNodeModules,
        maxDepth: parseInt(options.maxDepth, 10),
        threshold: parseFloat(options.threshold),
        output: options.output,
        ...getGlobalOptions(program),
      });
      process.exitCode = result.exitCode;
    });

  // Check command
  program
    .command('check [files...]')
    .description('Check types and report low-confidence inferences')
    .option('--strict', 'Strict mode - require high confidence for all types', false)
    .option('--min-confidence <confidence>', 'Minimum confidence threshold', '0.8')
    .option('--fail-on-warnings', 'Exit with error on warnings', false)
    .action(async (files, options) => {
      const result = await checkCommand({
        files: files.length > 0 ? files : ['.'],
        strict: options.strict,
        minConfidence: parseFloat(options.minConfidence),
        failOnWarnings: options.failOnWarnings,
        ...getGlobalOptions(program),
      });
      process.exitCode = result.exitCode;
    });

  // Watch command
  program
    .command('watch [files...]')
    .description('Watch files and re-analyze on changes')
    .option('--debounce <ms>', 'Debounce delay in milliseconds', '300')
    .option('--no-initial', 'Skip initial analysis')
    .option('--clear', 'Clear console on each run', false)
    .action(async (files, options) => {
      const result = await watchCommand({
        files: files.length > 0 ? files : ['.'],
        debounce: parseInt(options.debounce, 10),
        initial: options.initial !== false,
        clear: options.clear,
        ...getGlobalOptions(program),
      });
      process.exitCode = result.exitCode;
    });

  // Init command
  program
    .command('init [directory]')
    .description('Initialize PTL configuration in a project')
    .option('-f, --force', 'Overwrite existing configuration', false)
    .option('-p, --preset <preset>', 'Configuration preset (minimal, standard, strict)', 'standard')
    .action(async (directory, options) => {
      const result = await initCommand({
        directory: directory ?? '.',
        force: options.force,
        preset: options.preset,
        ...getGlobalOptions(program),
      });
      process.exitCode = result.exitCode;
    });

  return program;
}

/**
 * Extract global options from program
 */
function getGlobalOptions(program: Command) {
  const opts = program.opts();
  return {
    config: opts.config,
    verbose: opts.verbose ?? false,
    format: opts.format ?? 'text',
    quiet: opts.quiet ?? false,
    color: opts.color !== false,
  };
}

/**
 * Run the CLI with given arguments
 */
export async function runCLI(argv: string[]): Promise<number> {
  try {
    const program = createCLI();
    await program.parseAsync(argv);
    return process.exitCode ?? 0;
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red('Error:'), error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
    }
    return 1;
  }
}
