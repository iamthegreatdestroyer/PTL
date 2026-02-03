/**
 * @ptl/config
 *
 * Configuration loading, validation, and schema definitions for PTL.
 *
 * @packageDocumentation
 */

export { loadConfig, findConfigFile, resolveConfig } from './loader.js';
export { validateConfig, validatePartialConfig } from './validator.js';
export { defaultConfig, mergeConfig } from './defaults.js';
export type { PTLConfig, PartialPTLConfig, ConfigLoadResult } from './types.js';
export type {
  LatticeConfig,
  BayesianConfig,
  IncrementalConfig,
  AnalyzerConfig,
  OutputConfig,
  CacheConfig,
} from './types.js';
