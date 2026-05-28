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

import { defaultConfig, validateConfig, type PTLConfig } from '@ptl/config';
import type { InitOptions, CommandResult } from '../types.js';

const PRESETS: Record<string, Partial<PTLConfig>> = {
  minimal: {},
  standard: {},
  strict: {},
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

    const preset = PRESETS[options.preset] ?? PRESETS['standard'] ?? {};
    const config = mergeConfig(defaultConfig(options.directory), preset);

    // Validate config
    const validation = validateConfig(config);
    if (!validation.ok) {
      spinner.fail('Invalid configuration');
      for (const error of validation.error) {
        console.error(chalk.red(`  - ${String(error)}`));
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
  const result: Record<string, unknown> = { ...(base as unknown as Record<string, unknown>) };

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const baseVal = (base as unknown as Record<string, unknown>)[key];
    if (typeof value === 'object' && !Array.isArray(value) && typeof baseVal === 'object' && baseVal !== null) {
      result[key] = { ...(baseVal as unknown as Record<string, unknown>), ...(value as unknown as Record<string, unknown>) };
    } else {
      result[key] = value;
    }
  }

  return result as unknown as PTLConfig;
}
