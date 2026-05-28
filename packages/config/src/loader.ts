/**
 * Configuration Loader
 *
 * Load PTL configuration from files and environment.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { ok, err, type Result } from '@ptl/shared';
import { CONFIG_FILE_NAMES } from '@ptl/shared/constants';
import type {
  PTLConfig,
  PartialPTLConfig,
  ConfigLoadResult,
  ConfigValidationError,
} from './types.js';
import { validatePartialConfig } from './validator.js';
import { defaultConfig as _defaultConfig, mergeConfig } from './defaults.js';

/**
 * Find configuration file in directory and parent directories
 *
 * @param startDir - Starting directory
 * @returns Path to config file or undefined
 */
export function findConfigFile(startDir: string): string | undefined {
  let dir = resolve(startDir);
  const root = dirname(dir);

  while (dir !== root) {
    for (const name of CONFIG_FILE_NAMES) {
      const configPath = join(dir, name);
      if (existsSync(configPath)) {
        return configPath;
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return undefined;
}

/**
 * Parse configuration file
 *
 * @param configPath - Path to configuration file
 * @returns Parsed configuration or error
 */
function parseConfigFile(configPath: string): Result<PartialPTLConfig, string> {
  try {
    const content = readFileSync(configPath, 'utf-8');
    const ext = configPath.split('.').pop()?.toLowerCase();

    if (ext === 'json' || ext === 'ptlrc') {
      // Remove comments from JSON (simple // and /* */ handling)
      const jsonContent = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      return ok(JSON.parse(jsonContent));
    }

    // For .js/.mjs/.ts files, we'd need dynamic import
    // For now, return an error (would need async handling)
    return err(`Unsupported config file format: ${ext}`);
  } catch (error) {
    return err(`Failed to parse config file: ${error}`);
  }
}

/**
 * Load configuration from file and/or defaults
 *
 * @param options - Load options
 * @returns Configuration load result
 */
export function loadConfig(options?: {
  /** Configuration file path */
  configPath?: string;
  /** Project root directory */
  root?: string;
  /** Inline configuration overrides */
  overrides?: PartialPTLConfig;
}): Result<ConfigLoadResult, readonly ConfigValidationError[]> {
  const { configPath: explicitPath, root: explicitRoot, overrides } = options ?? {};

  // Determine root directory
  const cwd = process.cwd();
  const root = explicitRoot ? resolve(explicitRoot) : cwd;

  // Find config file
  const configPath = explicitPath ? resolve(explicitPath) : findConfigFile(root);

  const warnings: string[] = [];
  let fileConfig: PartialPTLConfig = {};

  if (configPath) {
    const parseResult = parseConfigFile(configPath);
    if (parseResult.ok) {
      fileConfig = parseResult.value;
    } else {
      warnings.push(`Warning: ${parseResult.error}`);
    }
  }

  // Merge: defaults < file config < overrides
  const merged: PartialPTLConfig = {
    ...fileConfig,
    ...overrides,
  };

  // Validate and get final config
  const validationResult = validatePartialConfig(merged, root);

  if (!validationResult.ok) {
    return err(validationResult.error);
  }

  return ok({
    config: validationResult.value,
    ...(configPath ? { configPath } : {}),
    warnings,
  } as ConfigLoadResult);
}

/**
 * Resolve configuration with explicit overrides
 *
 * This is a convenience function for programmatic usage.
 *
 * @param overrides - Configuration overrides
 * @param root - Project root directory
 * @returns Resolved configuration
 */
export function resolveConfig(
  overrides: PartialPTLConfig = {},
  root: string = process.cwd()
): PTLConfig {
  return mergeConfig(overrides, resolve(root));
}

/**
 * Get configuration from environment variables
 *
 * Environment variables are prefixed with PTL_ and use SCREAMING_SNAKE_CASE.
 * For example: PTL_BAYESIAN_MIN_CONFIDENCE=0.8
 *
 * @returns Partial configuration from environment
 */
export function getConfigFromEnv(): PartialPTLConfig {
  const env = process.env;
  const config: Record<string, unknown> = {};

  // Helper to parse env value
  const parse = (value: string): unknown => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  // Map environment variables
  const mapping: Record<string, string[]> = {
    PTL_ROOT: ['root'],
    PTL_TSCONFIG: ['tsconfig'],
    PTL_LATTICE_INCLUDE_STDLIB: ['lattice', 'includeStdlib'],
    PTL_LATTICE_INCLUDE_DOM: ['lattice', 'includeDom'],
    PTL_LATTICE_MAX_DEPTH: ['lattice', 'maxDepth'],
    PTL_BAYESIAN_DEFAULT_ALPHA: ['bayesian', 'defaultAlpha'],
    PTL_BAYESIAN_SMOOTHING: ['bayesian', 'smoothing'],
    PTL_BAYESIAN_MIN_CONFIDENCE: ['bayesian', 'minConfidence'],
    PTL_BAYESIAN_MAX_ALTERNATIVES: ['bayesian', 'maxAlternatives'],
    PTL_INCREMENTAL_ENABLED: ['incremental', 'enabled'],
    PTL_INCREMENTAL_MAX_PROPAGATION_DEPTH: ['incremental', 'maxPropagationDepth'],
    PTL_CACHE_ENABLED: ['cache', 'enabled'],
    PTL_CACHE_DIRECTORY: ['cache', 'directory'],
    PTL_OUTPUT_FORMAT: ['output', 'format'],
  };

  for (const [envKey, path] of Object.entries(mapping)) {
    const value = env[envKey];
    if (value === undefined) continue;

    let target = config;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i]!;
      if (!target[key]) {
        target[key] = {};
      }
      target = target[key] as Record<string, unknown>;
    }
    target[path[path.length - 1]!] = parse(value);
  }

  return config as PartialPTLConfig;
}
