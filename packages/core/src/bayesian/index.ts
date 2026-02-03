/**
 * Bayesian Inference Module
 *
 * Implements Bayesian type inference using Dirichlet distributions
 * as conjugate priors for multinomial type observations.
 *
 * Key concepts:
 * - Dirichlet distribution: Conjugate prior for categorical/multinomial
 * - Type beliefs: Probability distribution over possible types
 * - Confidence intervals: Credible intervals for type probabilities
 *
 * @packageDocumentation
 */

export { DirichletDistribution } from './dirichlet.js';
export { BayesianInferenceEngine, createBayesianEngine } from './bayesian-inference.js';
export type {
  TypeBelief,
  PriorConfig,
  InferenceResult,
  ConfidenceInterval,
  Observation,
  ObservationKind,
  InferenceOptions,
} from './types.js';
