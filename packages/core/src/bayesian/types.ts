/**
 * Type definitions for Bayesian inference module
 */

/**
 * A belief about a type's probability
 */
export interface TypeBelief {
  /** Type ID in the lattice */
  readonly typeId: string;

  /** Mean probability (expected value) */
  readonly probability: number;

  /** Variance in the probability estimate */
  readonly variance: number;

  /** Confidence interval */
  readonly confidence: ConfidenceInterval;

  /** Effective sample size contributing to this belief */
  readonly effectiveSampleSize: number;
}

/**
 * Confidence interval for a probability estimate
 */
export interface ConfidenceInterval {
  /** Lower bound of the interval */
  readonly lower: number;

  /** Upper bound of the interval */
  readonly upper: number;

  /** Confidence level (e.g., 0.95 for 95%) */
  readonly level: number;
}

/**
 * Result of a type inference operation
 */
export interface InferenceResult {
  /** Symbol being inferred */
  readonly symbolId: string;

  /** All type beliefs sorted by probability */
  readonly beliefs: readonly TypeBelief[];

  /** The most likely type */
  readonly mostLikely: TypeBelief;

  /** Total observations contributing to this inference */
  readonly totalObservations: number;

  /** Entropy of the distribution (uncertainty measure) */
  readonly entropy: number;

  /** Whether the inference is "settled" (low entropy, high confidence) */
  readonly isSettled: boolean;

  /** Timestamp of last update */
  readonly lastUpdated: number;
}

/**
 * Configuration for prior distributions
 */
export interface PriorConfig {
  /** Default concentration parameter (α) for new types */
  readonly defaultAlpha: number;

  /** Prior counts for specific types (from training data) */
  readonly typePriors: ReadonlyMap<string, number>;

  /** Whether to use empirical priors from codebase statistics */
  readonly useEmpirical: boolean;

  /** Smoothing factor for unseen types */
  readonly smoothing: number;

  /** Minimum probability to consider a type */
  readonly minProbability: number;
}

/**
 * An observation about a type
 */
export interface Observation {
  /** Type ID observed */
  readonly typeId: string;

  /** Kind of observation */
  readonly kind: ObservationKind;

  /** Weight of this observation (default: 1.0) */
  readonly weight: number;

  /** Source of the observation */
  readonly source: ObservationSource;

  /** Timestamp of the observation */
  readonly timestamp: number;
}

/**
 * Kind of type observation
 */
export type ObservationKind =
  | 'assignment' // x = value (direct assignment)
  | 'parameter' // function(x: Type) (parameter with type)
  | 'return' // return value (function return)
  | 'property' // x.prop (property access)
  | 'method-call' // x.method() (method invocation)
  | 'operation' // x + y (operator usage)
  | 'comparison' // x === y (comparison)
  | 'control-flow' // if (x) (truthiness check)
  | 'type-guard' // if (typeof x === 'string') (type narrowing)
  | 'assertion' // x as Type (type assertion)
  | 'annotation'; // x: Type (explicit annotation)

/**
 * Source of an observation
 */
export interface ObservationSource {
  /** File path */
  readonly file: string;

  /** Line number */
  readonly line: number;

  /** Column number */
  readonly column: number;

  /** Code snippet */
  readonly snippet?: string;
}

/**
 * Options for inference operations
 */
export interface InferenceOptions {
  /** Confidence level for intervals (default: 0.95) */
  readonly confidenceLevel: number;

  /** Minimum observations before considering settled */
  readonly minObservations: number;

  /** Maximum entropy for settled state */
  readonly maxEntropyForSettled: number;

  /** Whether to include lattice relationships */
  readonly useLattice: boolean;

  /** Maximum types to return in beliefs */
  readonly maxBeliefs: number;
}

/**
 * Parameters for a Dirichlet distribution
 */
export interface DirichletParams {
  /** Concentration parameters (alpha values) indexed by type ID */
  readonly alphas: ReadonlyMap<string, number>;

  /** Sum of all alpha values */
  readonly alphaSum: number;

  /** Number of categories (types) */
  readonly dimension: number;
}
