/**
 * Default Configuration
 *
 * Default values and merge utilities for PTL configuration.
 */

import type {
  PTLConfig,
  PartialPTLConfig,
  LatticeConfig,
  BayesianConfig,
  IncrementalConfig,
  AnalyzerConfig,
  OutputConfig,
  CacheConfig,
} from './types.js';

/**
 * Default lattice configuration
 */
export const defaultLatticeConfig: LatticeConfig = {
  includeStdlib: true,
  includeDom: false,
  maxDepth: 15,
};

/**
 * Default Bayesian configuration
 */
export const defaultBayesianConfig: BayesianConfig = {
  defaultAlpha: 1.0,
  smoothing: 0.1,
  minConfidence: 0.6,
  maxAlternatives: 5,
  useTypePriors: true,
};

/**
 * Default incremental configuration
 */
export const defaultIncrementalConfig: IncrementalConfig = {
  enabled: true,
  maxPropagationDepth: 3,
  debounceDelay: 100,
  trackDependencies: true,
};

/**
 * Default analyzer configuration
 */
export const defaultAnalyzerConfig: AnalyzerConfig = {
  include: ['**/*.ts', '**/*.tsx'],
  exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
  includePrivate: false,
  maxFileSize: 1048576, // 1MB
  parseJsDoc: true,
};

/**
 * Default output configuration
 */
export const defaultOutputConfig: OutputConfig = {
  format: 'json',
  includeSnippets: true,
  maxAlternatives: 3,
  showConfidenceIntervals: true,
};

/**
 * Default cache configuration
 */
export const defaultCacheConfig: CacheConfig = {
  enabled: true,
  directory: '.ptl-cache',
  ttl: 86400, // 24 hours
  maxSize: 104857600, // 100MB
};

/**
 * Create default configuration for a given root directory
 *
 * @param root - Project root directory
 * @returns Default PTL configuration
 */
export function defaultConfig(root: string): PTLConfig {
  return {
    version: 1,
    root,
    lattice: defaultLatticeConfig,
    bayesian: defaultBayesianConfig,
    incremental: defaultIncrementalConfig,
    analyzer: defaultAnalyzerConfig,
    output: defaultOutputConfig,
    cache: defaultCacheConfig,
  };
}

/**
 * Deep merge two objects
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue !== undefined &&
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[keyof T];
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[keyof T];
    }
  }

  return result;
}

/**
 * Merge partial configuration with defaults
 *
 * @param partial - Partial configuration
 * @param root - Project root directory (used if not in partial)
 * @returns Complete configuration
 */
export function mergeConfig(partial: PartialPTLConfig, root: string): PTLConfig {
  const base = defaultConfig(partial.root ?? root);

  return {
    version: 1,
    root: partial.root ?? root,
    tsconfig: partial.tsconfig ?? base.tsconfig,
    lattice: partial.lattice ? deepMerge(base.lattice, partial.lattice) : base.lattice,
    bayesian: partial.bayesian ? deepMerge(base.bayesian, partial.bayesian) : base.bayesian,
    incremental: partial.incremental
      ? deepMerge(base.incremental, partial.incremental)
      : base.incremental,
    analyzer: partial.analyzer ? deepMerge(base.analyzer, partial.analyzer) : base.analyzer,
    output: partial.output ? deepMerge(base.output, partial.output) : base.output,
    cache: partial.cache ? deepMerge(base.cache, partial.cache) : base.cache,
  };
}
