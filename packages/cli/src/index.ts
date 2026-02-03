/**
 * @ptl/cli
 *
 * Command-line interface for PTL (Probabilistic Type Lattice).
 *
 * @packageDocumentation
 */

export { createCLI, runCLI } from './cli.js';
export { analyzeCommand } from './commands/analyze.js';
export { checkCommand } from './commands/check.js';
export { initCommand } from './commands/init.js';
export { watchCommand } from './commands/watch.js';

export type {
  CLIOptions,
  CommandResult,
  AnalyzeOptions,
  CheckOptions,
  WatchOptions,
} from './types.js';

export { formatOutput, formatDiagnostic } from './formatters/index.js';
export { Reporter, ConsoleReporter, JsonReporter } from './reporters/index.js';
