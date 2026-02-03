/**
 * Type Priors
 *
 * Functions for loading and querying type priors.
 */

import type { TypeFrequency, ContextPattern, PriorConfig, TypeCategory } from './types.js';
import {
  BUILTIN_TYPE_FREQUENCIES,
  TYPE_TRANSITIONS,
  COMMON_PATTERNS,
  CONTEXT_WEIGHTS,
} from './data.js';

/**
 * Type prior data for a single type
 */
export interface TypePriorData {
  /**
   * Type name
   */
  readonly type: string;

  /**
   * Prior probability
   */
  readonly prior: number;

  /**
   * Dirichlet alpha (concentration parameter)
   */
  readonly alpha: number;

  /**
   * Category of this type
   */
  readonly category: TypeCategory;

  /**
   * Confidence in this prior (based on sample size)
   */
  readonly confidence: number;
}

/**
 * Prior database containing all loaded priors
 */
export interface PriorDatabase {
  /**
   * Type frequencies
   */
  readonly frequencies: ReadonlyMap<string, TypeFrequency>;

  /**
   * Type transitions
   */
  readonly transitions: ReadonlyMap<string, ReadonlyMap<string, number>>;

  /**
   * Context patterns
   */
  readonly patterns: readonly ContextPattern[];

  /**
   * Configuration used
   */
  readonly config: PriorConfig;
}

// Cached database
let cachedDb: PriorDatabase | null = null;
let cachedConfig: PriorConfig | null = null;

/**
 * Default prior configuration
 */
const DEFAULT_CONFIG: PriorConfig = {
  includeStdlib: true,
  includeDom: false,
  strength: 1.0,
};

/**
 * Load priors with given configuration
 *
 * @param config - Configuration options
 * @returns Prior database
 */
export function loadPriors(config: Partial<PriorConfig> = {}): PriorDatabase {
  const fullConfig: PriorConfig = { ...DEFAULT_CONFIG, ...config };

  // Check cache
  if (cachedDb && cachedConfig && configEquals(cachedConfig, fullConfig)) {
    return cachedDb;
  }

  // Build frequency map
  const frequencies = new Map<string, TypeFrequency>();

  // Filter types based on config
  const domTypes = new Set(['HTMLElement', 'Event', 'Node', 'Element', 'Document', 'Window']);

  for (const freq of BUILTIN_TYPE_FREQUENCIES) {
    // Skip DOM types if not enabled
    if (!fullConfig.includeDom && domTypes.has(freq.type)) {
      continue;
    }

    frequencies.set(freq.type, freq);
  }

  // Build transition map
  const transitions = new Map<string, Map<string, number>>();

  for (const matrix of TYPE_TRANSITIONS) {
    const transMap = new Map<string, number>();
    for (const t of matrix.transitions) {
      transMap.set(t.to, t.probability);
    }
    transitions.set(matrix.from, transMap);
  }

  const db: PriorDatabase = {
    frequencies,
    transitions: transitions as ReadonlyMap<string, ReadonlyMap<string, number>>,
    patterns: COMMON_PATTERNS,
    config: fullConfig,
  };

  // Cache
  cachedDb = db;
  cachedConfig = fullConfig;

  return db;
}

/**
 * Get prior data for a specific type
 *
 * @param typeName - Name of the type
 * @param config - Optional configuration
 * @returns Prior data or undefined if type unknown
 */
export function getTypePrior(
  typeName: string,
  config?: Partial<PriorConfig>
): TypePriorData | undefined {
  const db = loadPriors(config);
  const freq = db.frequencies.get(typeName);

  if (!freq) {
    return undefined;
  }

  const category = categorizeType(typeName);
  const alpha = freq.probability * (config?.strength ?? 1.0);
  const confidence = 1 - freq.stderr / freq.probability;

  return {
    type: typeName,
    prior: freq.probability,
    alpha,
    category,
    confidence: Math.max(0, Math.min(1, confidence)),
  };
}

/**
 * Get transition probability from one type to another
 *
 * @param fromType - Source type
 * @param toType - Target type
 * @param config - Optional configuration
 * @returns Transition probability or undefined
 */
export function getTransitionProbability(
  fromType: string,
  toType: string,
  config?: Partial<PriorConfig>
): number | undefined {
  const db = loadPriors(config);
  const transitions = db.transitions.get(fromType);

  if (!transitions) {
    return undefined;
  }

  return transitions.get(toType);
}

/**
 * Get context-based prior for an identifier
 *
 * @param identifier - Variable/function name
 * @param config - Optional configuration
 * @returns Array of type probabilities
 */
export function getContextPrior(
  identifier: string,
  config?: Partial<PriorConfig>
): ReadonlyArray<{ type: string; probability: number }> {
  const db = loadPriors(config);
  const results = new Map<string, number>();

  // Check each pattern
  for (const pattern of db.patterns) {
    for (const indicator of pattern.indicators) {
      if (indicator.type !== 'identifier') continue;

      const regex = new RegExp(indicator.pattern);
      if (regex.test(identifier)) {
        // Pattern matches - add weighted probabilities
        const weight = indicator.weight * CONTEXT_WEIGHTS.identifier;

        for (const tp of pattern.typeProbabilities) {
          const existing = results.get(tp.type) ?? 0;
          const contribution = tp.probability * weight;
          results.set(tp.type, existing + contribution);
        }
      }
    }
  }

  // Normalize
  const total = Array.from(results.values()).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return [];
  }

  const normalized: Array<{ type: string; probability: number }> = [];

  for (const [type, prob] of results) {
    normalized.push({ type, probability: prob / total });
  }

  // Sort by probability descending
  normalized.sort((a, b) => b.probability - a.probability);

  return normalized;
}

/**
 * Categorize a type name
 */
function categorizeType(typeName: string): TypeCategory {
  const primitives = new Set([
    'string',
    'number',
    'boolean',
    'null',
    'undefined',
    'void',
    'never',
    'symbol',
    'bigint',
  ]);
  const builtins = new Set(['any', 'unknown', 'object']);
  const collections = new Set(['Array', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Record']);

  if (primitives.has(typeName)) return 'primitive';
  if (builtins.has(typeName)) return 'builtin';
  if (collections.has(typeName)) return 'collection';
  if (typeName === 'Promise') return 'promise';
  if (typeName === 'Function') return 'function';
  if (typeName.includes('|')) return 'union';
  if (typeName.includes('&')) return 'intersection';
  if (typeName.includes('<')) return 'generic';
  if (/^[A-Z]/.test(typeName)) return 'class';

  return 'unknown';
}

/**
 * Check if two configs are equal
 */
function configEquals(a: PriorConfig, b: PriorConfig): boolean {
  return (
    a.includeStdlib === b.includeStdlib &&
    a.includeDom === b.includeDom &&
    a.customPath === b.customPath &&
    a.strength === b.strength
  );
}

// Re-export data for direct access
export { TYPE_TRANSITIONS };
