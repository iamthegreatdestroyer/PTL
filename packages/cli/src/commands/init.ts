/**
 * Init Command
 *
 * Initialize PTL configuration in a project.
 */

import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import ora from 'ora';
import chalk from 'chalk';

import { DEFAULT_CONFIG, validateConfig, type PTLConfig } from '@ptl/config';
import type { InitOptions, CommandResult } from '../types.js';

/**
 * Configuration presets
 */
const PRESETS: Record<string, Partial<PTLConfig>> = {
  minimal: {
    inference: {
      maxIterations: 50,
      convergenceThreshold: 0.01,
      priorStrength: 0.3,
      enableSpeculation: false,
    },
    output: {
      showConfidenceIntervals: false,
      minConfidenceToShow: 0.5,
    },
  },
  standard: {
    // Uses defaults
  },
  strict: {
    inference: {
      maxIterations: 200,
      convergenceThreshold: 0.001,
      priorStrength: 0.5,
      enableSpeculation: true,
    },
    output: {
      minConfidenceToShow: 0.8,
      showAlternatives: true,
    },
  },
};

/**
 * Execute the init command
 */
export async function initCommand(options: InitOptions): Promise<CommandResult> {
  const spinner = ora({ isSilent: options.quiet });

  try {
    const targetDir = resolve(options.directory);
    const configPath = join(targetDir, 'ptl.config.json');

    // Check for existing config
    if (existsSync(configPath) && !options.force) {
      spinner.warn(`Configuration already exists at ${configPath}`);
      console.log(chalk.yellow('Use --force to overwrite'));
      return {
        exitCode: 1,
        diagnostics: [],
        summary: 'Configuration already exists',
      };
    }

    // Create configuration
    spinner.start('Creating configuration...');

    const preset = PRESETS[options.preset] ?? PRESETS.standard;
    const config = mergeConfig(DEFAULT_CONFIG, preset);

    // Validate config
    const validation = validateConfig(config);
    if (!validation.valid) {
      spinner.fail('Invalid configuration');
      for (const error of validation.errors) {
        console.error(chalk.red(`  - ${error}`));
      }
      return {
        exitCode: 1,
        diagnostics: [],
        summary: 'Invalid configuration',
      };
    }

    // Ensure directory exists
    await mkdir(targetDir, { recursive: true });

    // Write config file
    const configContent = JSON.stringify(config, null, 2);
    await writeFile(configPath, configContent, 'utf-8');

    spinner.succeed(`Created ${chalk.cyan('ptl.config.json')}`);

    // Create .ptlignore if it doesn't exist
    const ignorePath = join(targetDir, '.ptlignore');
    if (!existsSync(ignorePath)) {
      const ignoreContent = [
        '# PTL Ignore File',
        '# Patterns here will be excluded from analysis',
        '',
        'node_modules/',
        'dist/',
        'build/',
        '*.d.ts',
        '*.test.ts',
        '*.spec.ts',
        '__tests__/',
        '',
      ].join('\n');

      await writeFile(ignorePath, ignoreContent, 'utf-8');
      console.log(`Created ${chalk.cyan('.ptlignore')}`);
    }

    // Print next steps
    console.log('');
    console.log(chalk.green('✓ PTL initialized successfully!'));
    console.log('');
    console.log('Next steps:');
    console.log(`  1. Review ${chalk.cyan('ptl.config.json')} and adjust settings`);
    console.log(`  2. Run ${chalk.cyan('ptl analyze')} to analyze your project`);
    console.log(`  3. Run ${chalk.cyan('ptl check')} to check type confidence`);
    console.log('');

    return {
      exitCode: 0,
      diagnostics: [],
      summary: 'PTL initialized successfully',
    };
  } catch (error) {
    spinner.fail('Initialization failed');
    throw error;
  }
}

/**
 * Deep merge configuration objects
 */
function mergeConfig(base: PTLConfig, override: Partial<PTLConfig>): PTLConfig {
  const result = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (value !== undefined && typeof value === 'object' && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = mergeConfig(
        (base as Record<string, unknown>)[key] as PTLConfig,
        value
      );
    } else if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}
