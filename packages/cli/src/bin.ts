#!/usr/bin/env node
/**
 * PTL CLI Entry Point
 *
 * This is the main executable for the PTL command-line interface.
 */

import { runCLI } from './cli.js';

// Run the CLI and handle exit
runCLI(process.argv)
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
