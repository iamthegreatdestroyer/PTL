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

// ── Shared field-validation helpers ─────────────────────────────────────────
// Extracted 2026-07-02: the six validate*Config functions below previously
// copy-pasted the same object-guard + per-field type/range checks (~10x
// duplication flagged by running NLCI inward on the ecosystem — see
// ECOSYSTEM_SELF_ANALYSIS.md). Behaviour and error messages are unchanged.

function expectObject(
  config: unknown,
  section: string,
  errors: ConfigValidationError[]
): Record<string, unknown> | null {
  if (typeof config !== 'object' || config === null) {
    errors.push({ path: section, message: 'Must be an object', value: config });
    return null;
  }
  return config as Record<string, unknown>;
}

function checkBoolean(
  cfg: Record<string, unknown>,
  section: string,
  key: string,
  errors: ConfigValidationError[]
): void {
  if (cfg[key] !== undefined && typeof cfg[key] !== 'boolean') {
    errors.push({ path: `${section}.${key}`, message: 'Must be a boolean', value: cfg[key] });
  }
}

function checkString(
  cfg: Record<string, unknown>,
  section: string,
  key: string,
  errors: ConfigValidationError[]
): void {
  if (cfg[key] !== undefined && typeof cfg[key] !== 'string') {
    errors.push({ path: `${section}.${key}`, message: 'Must be a string', value: cfg[key] });
  }
}

function checkStringArray(
  cfg: Record<string, unknown>,
  section: string,
  key: string,
  errors: ConfigValidationError[]
): void {
  if (cfg[key] !== undefined && !isStringArray(cfg[key])) {
    errors.push({
      path: `${section}.${key}`,
      message: 'Must be an array of strings',
      value: cfg[key],
    });
  }
}

function checkNumberRange(
  cfg: Record<string, unknown>,
  section: string,
  key: string,
  min: number,
  max: number,
  errors: ConfigValidationError[]
): void {
  const v = cfg[key];
  if (v !== undefined && (typeof v !== 'number' || v < min || v > max)) {
    errors.push({
      path: `${section}.${key}`,
      message: `Must be a number between ${min} and ${max}`,
      value: v,
    });
  }
}

function checkPositiveNumber(
  cfg: Record<string, unknown>,
  section: string,
  key: string,
  errors: ConfigValidationError[]
): void {
  const v = cfg[key];
  if (v !== undefined && (typeof v !== 'number' || v <= 0)) {
    errors.push({ path: `${section}.${key}`, message: 'Must be a positive number', value: v });
  }
}

function checkNonNegativeNumber(
  cfg: Record<string, unknown>,
  section: string,
  key: string,
  errors: ConfigValidationError[]
): void {
  const v = cfg[key];
  if (v !== undefined && (typeof v !== 'number' || v < 0)) {
    errors.push({
      path: `${section}.${key}`,
      message: 'Must be a non-negative number',
      value: v,
    });
  }
}

function checkEnum(
  cfg: Record<string, unknown>,
  section: string,
  key: string,
  valid: string[],
  errors: ConfigValidationError[]
): void {
  if (cfg[key] !== undefined && !valid.includes(cfg[key] as string)) {
    errors.push({
      path: `${section}.${key}`,
      message: `Must be one of: ${valid.join(', ')}`,
      value: cfg[key],
    });
  }
}

// ── Per-section validators (now thin, via the helpers above) ─────────────────

function validateLatticeConfig(
  config: unknown,
  errors: ConfigValidationError[],
  _partial = false
): void {
  const cfg = expectObject(config, 'lattice', errors);
  if (!cfg) return;
  checkBoolean(cfg, 'lattice', 'includeStdlib', errors);
  checkBoolean(cfg, 'lattice', 'includeDom', errors);
  checkNumberRange(cfg, 'lattice', 'maxDepth', 1, 100, errors);
}

function validateBayesianConfig(
  config: unknown,
  errors: ConfigValidationError[],
  _partial = false
): void {
  const cfg = expectObject(config, 'bayesian', errors);
  if (!cfg) return;
  checkPositiveNumber(cfg, 'bayesian', 'defaultAlpha', errors);
  checkNumberRange(cfg, 'bayesian', 'smoothing', 0, 1, errors);
  checkNumberRange(cfg, 'bayesian', 'minConfidence', 0, 1, errors);
  checkNumberRange(cfg, 'bayesian', 'maxAlternatives', 1, 20, errors);
}

function validateIncrementalConfig(
  config: unknown,
  errors: ConfigValidationError[],
  _partial = false
): void {
  const cfg = expectObject(config, 'incremental', errors);
  if (!cfg) return;
  checkBoolean(cfg, 'incremental', 'enabled', errors);
  checkNonNegativeNumber(cfg, 'incremental', 'maxPropagationDepth', errors);
  checkNonNegativeNumber(cfg, 'incremental', 'debounceDelay', errors);
}

function validateAnalyzerConfig(
  config: unknown,
  errors: ConfigValidationError[],
  _partial = false
): void {
  const cfg = expectObject(config, 'analyzer', errors);
  if (!cfg) return;
  checkStringArray(cfg, 'analyzer', 'include', errors);
  checkStringArray(cfg, 'analyzer', 'exclude', errors);
  checkPositiveNumber(cfg, 'analyzer', 'maxFileSize', errors);
}

function validateOutputConfig(
  config: unknown,
  errors: ConfigValidationError[],
  _partial = false
): void {
  const cfg = expectObject(config, 'output', errors);
  if (!cfg) return;
  checkEnum(cfg, 'output', 'format', ['json', 'sarif', 'text', 'markdown'], errors);
}

function validateCacheConfig(
  config: unknown,
  errors: ConfigValidationError[],
  _partial = false
): void {
  const cfg = expectObject(config, 'cache', errors);
  if (!cfg) return;
  checkBoolean(cfg, 'cache', 'enabled', errors);
  checkString(cfg, 'cache', 'directory', errors);
  checkPositiveNumber(cfg, 'cache', 'ttl', errors);
  checkPositiveNumber(cfg, 'cache', 'maxSize', errors);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}
