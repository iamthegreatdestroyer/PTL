/**
 * @ptl/type-priors
 *
 * Pre-trained type frequency priors for PTL Bayesian inference.
 *
 * This package contains:
 * - Type frequency data from analysis of open source TypeScript projects
 * - Type transition probabilities (P(type_new | type_old))
 * - Context-aware prior distributions
 *
 * @packageDocumentation
 */

export {
  getTypePrior,
  getTransitionProbability,
  getContextPrior,
  loadPriors,
  type TypePriorData,
  type PriorDatabase,
} from './priors.js';

export { BUILTIN_TYPE_FREQUENCIES, COMMON_PATTERNS, CONTEXT_WEIGHTS } from './data.js';

export type { TypeFrequency, TransitionMatrix, ContextPattern, PriorConfig } from './types.js';
