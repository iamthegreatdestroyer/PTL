/**
 * Configuration Validation
 *
 * Validate PTL configuration against schema.
 */

import { err, ok } from '@ptl/shared';
import type { Result } from '@ptl/shared';
import type { PTLConfig, PartialPTLConfig, ConfigValidationError } from './types.js';
import { mergeConfig } from './defaults.js';

/**
 * Validate a complete configuration
 *
 * @param config - Configuration to validate
 * @returns Validation result
 */
export function validateConfig(
  config: unknown
): Result<PTLConfig, readonly ConfigValidationError[]> {
  const errors: ConfigValidationError[] = [];

  if (typeof config !== 'object' || config === null) {
    return err([{ path: '', message: 'Configuration must be an object' }]);
  }

  const cfg = config as Record<string, unknown>;

  // Version
  if (cfg['version'] !== undefined && cfg['version'] !== 1) {
    errors.push({
      path: 'version',
      message: 'Version must be 1',
      value: cfg['version'],
    });
  }

  // Root
  if (typeof cfg['root'] !== 'string' || cfg['root'].length === 0) {
    errors.push({
      path: 'root',
      message: 'Root must be a non-empty string',
      value: cfg['root'],
    });
  }

  // Validate sub-configs
  if (cfg['lattice'] !== undefined) {
    validateLatticeConfig(cfg['lattice'], errors);
  }

  if (cfg['bayesian'] !== undefined) {
    validateBayesianConfig(cfg['bayesian'], errors);
  }

  if (cfg['incremental'] !== undefined) {
    validateIncrementalConfig(cfg['incremental'], errors);
  }

  if (cfg['analyzer'] !== undefined) {
    validateAnalyzerConfig(cfg['analyzer'], errors);
  }

  if (cfg['output'] !== undefined) {
    validateOutputConfig(cfg['output'], errors);
  }

  if (cfg['cache'] !== undefined) {
    validateCacheConfig(cfg['cache'], errors);
  }

  if (errors.length > 0) {
    return err(errors);
  }

  return ok(config as PTLConfig);
}

/**
 * Validate a partial configuration and merge with defaults
 *
 * @param config - Partial configuration
 * @param root - Project root directory
 * @returns Validation result with merged config
 */
export function validatePartialConfig(
  config: unknown,
  root: string
): Result<PTLConfig, readonly ConfigValidationError[]> {
  const errors: ConfigValidationError[] = [];

  if (typeof config !== 'object' || config === null) {
    return err([{ path: '', message: 'Configuration must be an object' }]);
  }

  const cfg = config as Record<string, unknown>;

  // Version check (optional but must be 1 if present)
  if (cfg['version'] !== undefined && cfg['version'] !== 1) {
    errors.push({
      path: 'version',
      message: 'Version must be 1',
      value: cfg['version'],
    });
  }

  // Validate sub-configs (partial)
  if (cfg['lattice'] !== undefined) {
    validateLatticeConfig(cfg['lattice'], errors, true);
  }

  if (cfg['bayesian'] !== undefined) {
    validateBayesianConfig(cfg['bayesian'], errors, true);
  }

  if (cfg['incremental'] !== undefined) {
    validateIncrementalConfig(cfg['incremental'], errors, true);
  }

  if (cfg['analyzer'] !== undefined) {
    validateAnalyzerConfig(cfg['analyzer'], errors, true);
  }

  if (cfg['output'] !== undefined) {
    validateOutputConfig(cfg['output'], errors, true);
  }

  if (cfg['cache'] !== undefined) {
    validateCacheConfig(cfg['cache'], errors, true);
  }

  if (errors.length > 0) {
    return err(errors);
  }

  // Merge with defaults
  const merged = mergeConfig(config as PartialPTLConfig, root);
  return ok(merged);
}

function validateLatticeConfig(
  config: unknown,
  errors: ConfigValidationError[],
  _partial = false
): void {
  if (typeof config !== 'object' || config === null) {
    errors.push({ path: 'lattice', message: 'Must be an object', value: config });
    return;
  }

  const cfg = config as Record<string, unknown>;

  if (cfg['includeStdlib'] !== undefined && typeof cfg['includeStdlib'] !== 'boolean') {
    errors.push({
      path: 'lattice.includeStdlib',
      message: 'Must be a boolean',
      value: cfg['includeStdlib'],
    });
  }

  if (cfg['includeDom'] !== undefined && typeof cfg['includeDom'] !== 'boolean') {
    errors.push({
      path: 'lattice.includeDom',
      message: 'Must be a boolean',
      value: cfg['includeDom'],
    });
  }

  if (cfg['maxDepth'] !== undefined) {
    if (typeof cfg['maxDepth'] !== 'number' || cfg['maxDepth'] < 1 || cfg['maxDepth'] > 100) {
      errors.push({
        path: 'lattice.maxDepth',
        message: 'Must be a number between 1 and 100',
        value: cfg['maxDepth'],
      });
    }
  }
}

function validateBayesianConfig(
  config: unknown,
  errors: ConfigValidationError[],
  _partial = false
): void {
  if (typeof config !== 'object' || config === null) {
    errors.push({ path: 'bayesian', message: 'Must be an object', value: config });
    return;
  }

  const cfg = config as Record<string, unknown>;

  if (cfg['defaultAlpha'] !== undefined) {
    if (typeof cfg['defaultAlpha'] !== 'number' || cfg['defaultAlpha'] <= 0) {
      errors.push({
        path: 'bayesian.defaultAlpha',
        message: 'Must be a positive number',
        value: cfg['defaultAlpha'],
      });
    }
  }

  if (cfg['smoothing'] !== undefined) {
    if (typeof cfg['smoothing'] !== 'number' || cfg['smoothing'] < 0 || cfg['smoothing'] > 1) {
      errors.push({
        path: 'bayesian.smoothing',
        message: 'Must be a number between 0 and 1',
        value: cfg['smoothing'],
      });
    }
  }

  if (cfg['minConfidence'] !== undefined) {
    if (
      typeof cfg['minConfidence'] !== 'number' ||
      cfg['minConfidence'] < 0 ||
      cfg['minConfidence'] > 1
    ) {
      errors.push({
        path: 'bayesian.minConfidence',
        message: 'Must be a number between 0 and 1',
        value: cfg['minConfidence'],
      });
    }
  }

  if (cfg['maxAlternatives'] !== undefined) {
    if (
      typeof cfg['maxAlternatives'] !== 'number' ||
      cfg['maxAlternatives'] < 1 ||
      cfg['maxAlternatives'] > 20
    ) {
      errors.push({
        path: 'bayesian.maxAlternatives',
        message: 'Must be a number between 1 and 20',
        value: cfg['maxAlternatives'],
      });
    }
  }
}

function validateIncrementalConfig(
  config: unknown,
  errors: ConfigValidationError[],
  _partial = false
): void {
  if (typeof config !== 'object' || config === null) {
    errors.push({ path: 'incremental', message: 'Must be an object', value: config });
    return;
  }

  const cfg = config as Record<string, unknown>;

  if (cfg['enabled'] !== undefined && typeof cfg['enabled'] !== 'boolean') {
    errors.push({
      path: 'incremental.enabled',
      message: 'Must be a boolean',
      value: cfg['enabled'],
    });
  }

  if (cfg['maxPropagationDepth'] !== undefined) {
    if (typeof cfg['maxPropagationDepth'] !== 'number' || cfg['maxPropagationDepth'] < 0) {
      errors.push({
        path: 'incremental.maxPropagationDepth',
        message: 'Must be a non-negative number',
        value: cfg['maxPropagationDepth'],
      });
    }
  }

  if (cfg['debounceDelay'] !== undefined) {
    if (typeof cfg['debounceDelay'] !== 'number' || cfg['debounceDelay'] < 0) {
      errors.push({
        path: 'incremental.debounceDelay',
        message: 'Must be a non-negative number',
        value: cfg['debounceDelay'],
      });
    }
  }
}

function validateAnalyzerConfig(
  config: unknown,
  errors: ConfigValidationError[],
  _partial = false
): void {
  if (typeof config !== 'object' || config === null) {
    errors.push({ path: 'analyzer', message: 'Must be an object', value: config });
    return;
  }

  const cfg = config as Record<string, unknown>;

  if (cfg['include'] !== undefined && !isStringArray(cfg['include'])) {
    errors.push({
      path: 'analyzer.include',
      message: 'Must be an array of strings',
      value: cfg['include'],
    });
  }

  if (cfg['exclude'] !== undefined && !isStringArray(cfg['exclude'])) {
    errors.push({
      path: 'analyzer.exclude',
      message: 'Must be an array of strings',
      value: cfg['exclude'],
    });
  }

  if (cfg['maxFileSize'] !== undefined) {
    if (typeof cfg['maxFileSize'] !== 'number' || cfg['maxFileSize'] <= 0) {
      errors.push({
        path: 'analyzer.maxFileSize',
        message: 'Must be a positive number',
        value: cfg['maxFileSize'],
      });
    }
  }
}

function validateOutputConfig(
  config: unknown,
  errors: ConfigValidationError[],
  _partial = false
): void {
  if (typeof config !== 'object' || config === null) {
    errors.push({ path: 'output', message: 'Must be an object', value: config });
    return;
  }

  const cfg = config as Record<string, unknown>;

  if (cfg['format'] !== undefined) {
    const validFormats = ['json', 'sarif', 'text', 'markdown'];
    if (!validFormats.includes(cfg['format'] as string)) {
      errors.push({
        path: 'output.format',
        message: `Must be one of: ${validFormats.join(', ')}`,
        value: cfg['format'],
      });
    }
  }
}

function validateCacheConfig(
  config: unknown,
  errors: ConfigValidationError[],
  _partial = false
): void {
  if (typeof config !== 'object' || config === null) {
    errors.push({ path: 'cache', message: 'Must be an object', value: config });
    return;
  }

  const cfg = config as Record<string, unknown>;

  if (cfg['enabled'] !== undefined && typeof cfg['enabled'] !== 'boolean') {
    errors.push({
      path: 'cache.enabled',
      message: 'Must be a boolean',
      value: cfg['enabled'],
    });
  }

  if (cfg['directory'] !== undefined && typeof cfg['directory'] !== 'string') {
    errors.push({
      path: 'cache.directory',
      message: 'Must be a string',
      value: cfg['directory'],
    });
  }

  if (cfg['ttl'] !== undefined) {
    if (typeof cfg['ttl'] !== 'number' || cfg['ttl'] <= 0) {
      errors.push({
        path: 'cache.ttl',
        message: 'Must be a positive number',
        value: cfg['ttl'],
      });
    }
  }

  if (cfg['maxSize'] !== undefined) {
    if (typeof cfg['maxSize'] !== 'number' || cfg['maxSize'] <= 0) {
      errors.push({
        path: 'cache.maxSize',
        message: 'Must be a positive number',
        value: cfg['maxSize'],
      });
    }
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}
