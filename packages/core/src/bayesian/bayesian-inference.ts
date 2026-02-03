/**
 * Bayesian Inference Engine
 *
 * The main engine that performs type inference using Bayesian statistics.
 * It maintains Dirichlet distributions for each symbol and updates them
 * as new type observations are made.
 */

import { DirichletDistribution } from './dirichlet.js';
import type {
  TypeBelief,
  PriorConfig,
  InferenceResult,
  Observation,
  InferenceOptions,
} from './types.js';
import type { TypeLattice } from '../lattice/type-lattice.js';

/**
 * Default prior configuration
 */
const DEFAULT_PRIOR_CONFIG: PriorConfig = {
  defaultAlpha: 1.0, // Uniform prior
  typePriors: new Map(),
  useEmpirical: true,
  smoothing: 0.1,
  minProbability: 0.001,
};

/**
 * Default inference options
 */
const DEFAULT_INFERENCE_OPTIONS: InferenceOptions = {
  confidenceLevel: 0.95,
  minObservations: 3,
  maxEntropyForSettled: 1.0,
  useLattice: true,
  maxBeliefs: 10,
};

/**
 * Symbol inference state
 */
interface SymbolState {
  /** Symbol identifier */
  symbolId: string;

  /** Dirichlet distribution for type beliefs */
  distribution: DirichletDistribution;

  /** All observations for this symbol */
  observations: Observation[];

  /** Last update timestamp */
  lastUpdated: number;
}

/**
 * Bayesian Inference Engine
 *
 * Manages type inference for all symbols in a codebase using
 * Bayesian updating with Dirichlet distributions.
 */
export class BayesianInferenceEngine {
  /** Symbol states indexed by symbol ID */
  private readonly symbols: Map<string, SymbolState> = new Map();

  /** Prior configuration */
  private readonly priorConfig: PriorConfig;

  /** Reference to type lattice (optional) */
  private readonly lattice?: TypeLattice;

  /** Global observation count for each type */
  private readonly globalTypeCounts: Map<string, number> = new Map();

  /** Total global observations */
  private totalObservations: number = 0;

  constructor(config?: Partial<PriorConfig>, lattice?: TypeLattice) {
    this.priorConfig = { ...DEFAULT_PRIOR_CONFIG, ...config };
    this.lattice = lattice;
  }

  /**
   * Get or create the state for a symbol
   */
  private getOrCreateSymbol(symbolId: string): SymbolState {
    let state = this.symbols.get(symbolId);

    if (!state) {
      // Create initial distribution with priors
      const initialAlphas = new Map<string, number>();

      // Add type-specific priors
      for (const [typeId, prior] of this.priorConfig.typePriors) {
        initialAlphas.set(typeId, prior);
      }

      state = {
        symbolId,
        distribution: new DirichletDistribution(initialAlphas),
        observations: [],
        lastUpdated: Date.now(),
      };

      this.symbols.set(symbolId, state);
    }

    return state;
  }

  /**
   * Observe a type for a symbol
   *
   * This is the main entry point for updating beliefs.
   * It performs Bayesian updating on the symbol's distribution.
   */
  observe(symbolId: string, observation: Observation): void {
    const state = this.getOrCreateSymbol(symbolId);

    // Record observation
    state.observations.push(observation);
    state.lastUpdated = observation.timestamp;

    // Determine the effective type to observe (considering lattice)
    const typesToObserve = this.getTypesToObserve(observation.typeId, observation.weight);

    // Update the Dirichlet distribution
    for (const [typeId, weight] of typesToObserve) {
      state.distribution.observe(typeId, weight);

      // Update global counts for empirical priors
      const globalCount = this.globalTypeCounts.get(typeId) ?? 0;
      this.globalTypeCounts.set(typeId, globalCount + weight);
      this.totalObservations += weight;
    }
  }

  /**
   * Get types to observe, potentially including lattice relationships
   */
  private getTypesToObserve(typeId: string, weight: number): Map<string, number> {
    const types = new Map<string, number>();

    // Primary observation
    types.set(typeId, weight);

    // If lattice is available, also give partial credit to supertypes
    if (this.lattice) {
      const ancestors = this.lattice.getAncestors(typeId);

      // Give decreasing credit to ancestors
      let depth = 1;
      for (const ancestor of ancestors) {
        if (ancestor === this.lattice.TOP) continue;

        // Credit decreases exponentially with distance
        const ancestorWeight = weight * Math.pow(0.5, depth);
        if (ancestorWeight >= this.priorConfig.smoothing) {
          types.set(ancestor, (types.get(ancestor) ?? 0) + ancestorWeight);
        }
        depth++;
      }
    }

    return types;
  }

  /**
   * Observe multiple types at once
   */
  observeMultiple(symbolId: string, observations: Observation[]): void {
    for (const observation of observations) {
      this.observe(symbolId, observation);
    }
  }

  /**
   * Get the current inference result for a symbol
   */
  infer(symbolId: string, options: Partial<InferenceOptions> = {}): InferenceResult {
    const opts: InferenceOptions = { ...DEFAULT_INFERENCE_OPTIONS, ...options };
    const state = this.getOrCreateSymbol(symbolId);

    // Get beliefs from distribution
    let beliefs = state.distribution.getBeliefs(opts.confidenceLevel);

    // Filter by minimum probability
    beliefs = beliefs.filter((b) => b.probability >= this.priorConfig.minProbability);

    // Limit number of beliefs
    beliefs = beliefs.slice(0, opts.maxBeliefs);

    // Calculate entropy
    const entropy = state.distribution.entropy();

    // Determine if settled
    const isSettled =
      state.observations.length >= opts.minObservations && entropy <= opts.maxEntropyForSettled;

    // Get most likely
    const mostLikely = beliefs[0] ?? {
      typeId: this.lattice?.TOP ?? 'unknown',
      probability: 1,
      variance: 0,
      confidence: { lower: 1, upper: 1, level: opts.confidenceLevel },
      effectiveSampleSize: 0,
    };

    return {
      symbolId,
      beliefs,
      mostLikely,
      totalObservations: state.observations.length,
      entropy,
      isSettled,
      lastUpdated: state.lastUpdated,
    };
  }

  /**
   * Get empirical prior for a type based on global observations
   */
  getEmpiricalPrior(typeId: string): number {
    if (this.totalObservations === 0) {
      return this.priorConfig.defaultAlpha;
    }

    const count = this.globalTypeCounts.get(typeId) ?? 0;
    return this.priorConfig.defaultAlpha + (count / this.totalObservations) * 10;
  }

  /**
   * Get all symbols being tracked
   */
  getSymbols(): string[] {
    return [...this.symbols.keys()];
  }

  /**
   * Check if a symbol is being tracked
   */
  hasSymbol(symbolId: string): boolean {
    return this.symbols.has(symbolId);
  }

  /**
   * Remove a symbol from tracking
   */
  removeSymbol(symbolId: string): boolean {
    return this.symbols.delete(symbolId);
  }

  /**
   * Get the raw distribution for a symbol
   */
  getDistribution(symbolId: string): DirichletDistribution | undefined {
    return this.symbols.get(symbolId)?.distribution;
  }

  /**
   * Get observations for a symbol
   */
  getObservations(symbolId: string): readonly Observation[] {
    return this.symbols.get(symbolId)?.observations ?? [];
  }

  /**
   * Get global type frequency
   */
  getGlobalTypeFrequency(typeId: string): number {
    if (this.totalObservations === 0) return 0;
    return (this.globalTypeCounts.get(typeId) ?? 0) / this.totalObservations;
  }

  /**
   * Get all global type counts
   */
  getGlobalTypeCounts(): ReadonlyMap<string, number> {
    return this.globalTypeCounts;
  }

  /**
   * Merge beliefs from another engine (for distributed inference)
   */
  merge(other: BayesianInferenceEngine, weight: number = 0.5): void {
    for (const [symbolId, otherState] of other.symbols) {
      const myState = this.getOrCreateSymbol(symbolId);

      // Merge distributions
      myState.distribution = myState.distribution.merge(otherState.distribution, weight);

      // Merge observations (append)
      myState.observations.push(...otherState.observations);
      myState.lastUpdated = Math.max(myState.lastUpdated, otherState.lastUpdated);
    }
  }

  /**
   * Serialize to JSON
   */
  toJSON(): object {
    const symbols: Record<string, object> = {};

    for (const [symbolId, state] of this.symbols) {
      symbols[symbolId] = {
        distribution: state.distribution.toJSON(),
        observations: state.observations,
        lastUpdated: state.lastUpdated,
      };
    }

    return {
      symbols,
      globalTypeCounts: Object.fromEntries(this.globalTypeCounts),
      totalObservations: this.totalObservations,
      priorConfig: {
        ...this.priorConfig,
        typePriors: Object.fromEntries(this.priorConfig.typePriors),
      },
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json: ReturnType<BayesianInferenceEngine['toJSON']>): BayesianInferenceEngine {
    const data = json as {
      symbols: Record<
        string,
        {
          distribution: { alphas: Record<string, number> };
          observations: Observation[];
          lastUpdated: number;
        }
      >;
      globalTypeCounts: Record<string, number>;
      totalObservations: number;
      priorConfig: Omit<PriorConfig, 'typePriors'> & { typePriors: Record<string, number> };
    };

    const engine = new BayesianInferenceEngine({
      ...data.priorConfig,
      typePriors: new Map(Object.entries(data.priorConfig.typePriors)),
    });

    for (const [symbolId, state] of Object.entries(data.symbols)) {
      const distribution = DirichletDistribution.fromJSON(state.distribution);
      engine.symbols.set(symbolId, {
        symbolId,
        distribution,
        observations: state.observations,
        lastUpdated: state.lastUpdated,
      });
    }

    for (const [typeId, count] of Object.entries(data.globalTypeCounts)) {
      engine.globalTypeCounts.set(typeId, count);
    }
    engine.totalObservations = data.totalObservations;

    return engine;
  }

  /**
   * Get statistics about the engine
   */
  getStats(): {
    symbolCount: number;
    totalObservations: number;
    uniqueTypes: number;
    averageEntropy: number;
  } {
    let totalEntropy = 0;
    let symbolsWithBeliefs = 0;

    for (const state of this.symbols.values()) {
      const entropy = state.distribution.entropy();
      if (!isNaN(entropy)) {
        totalEntropy += entropy;
        symbolsWithBeliefs++;
      }
    }

    return {
      symbolCount: this.symbols.size,
      totalObservations: this.totalObservations,
      uniqueTypes: this.globalTypeCounts.size,
      averageEntropy: symbolsWithBeliefs > 0 ? totalEntropy / symbolsWithBeliefs : 0,
    };
  }
}

/**
 * Factory function to create a BayesianInferenceEngine
 */
export function createBayesianEngine(
  config?: Partial<PriorConfig>,
  lattice?: TypeLattice
): BayesianInferenceEngine {
  return new BayesianInferenceEngine(config, lattice);
}
