/**
 * Dirichlet Distribution Implementation
 *
 * The Dirichlet distribution is the conjugate prior for the categorical
 * and multinomial distributions. It represents uncertainty over a probability
 * simplex (a vector of probabilities that sum to 1).
 *
 * For type inference:
 * - Each "category" is a possible type
 * - The α (alpha) parameters represent pseudo-counts
 * - Observing a type increases its α, shifting probability toward it
 *
 * Key properties:
 * - E[p_i] = α_i / α_0 where α_0 = Σα_i
 * - Var[p_i] = α_i(α_0 - α_i) / (α_0² (α_0 + 1))
 * - Posterior update: α_i' = α_i + count_i (conjugate property)
 */

import type { ConfidenceInterval, TypeBelief } from './types.js';

/**
 * Dirichlet Distribution for type inference
 *
 * Represents a probability distribution over a set of types.
 */
export class DirichletDistribution {
  /** Concentration parameters (α values) */
  private alphas: Map<string, number>;

  /** Cached sum of alphas */
  private alphaSum: number;

  /**
   * Create a new Dirichlet distribution
   *
   * @param initialAlphas - Initial concentration parameters
   */
  constructor(initialAlphas?: Map<string, number> | ReadonlyMap<string, number>) {
    this.alphas = new Map(initialAlphas);
    this.alphaSum = this.computeAlphaSum();
  }

  /**
   * Compute the sum of all alpha values
   */
  private computeAlphaSum(): number {
    let sum = 0;
    for (const alpha of this.alphas.values()) {
      sum += alpha;
    }
    return sum;
  }

  /**
   * Get the alpha value for a type
   */
  getAlpha(typeId: string): number {
    return this.alphas.get(typeId) ?? 0;
  }

  /**
   * Set the alpha value for a type
   */
  setAlpha(typeId: string, alpha: number): void {
    const oldAlpha = this.alphas.get(typeId) ?? 0;
    this.alphas.set(typeId, alpha);
    this.alphaSum += alpha - oldAlpha;
  }

  /**
   * Update the distribution with an observation
   * This is the Bayesian update rule for Dirichlet-Multinomial
   *
   * @param typeId - The type that was observed
   * @param count - Number of observations (default: 1)
   */
  observe(typeId: string, count: number = 1): void {
    const currentAlpha = this.alphas.get(typeId) ?? 0;
    this.alphas.set(typeId, currentAlpha + count);
    this.alphaSum += count;
  }

  /**
   * Update with multiple observations at once
   */
  observeMultiple(observations: Map<string, number> | ReadonlyMap<string, number>): void {
    for (const [typeId, count] of observations) {
      this.observe(typeId, count);
    }
  }

  /**
   * Get the expected probability (mean) for a type
   *
   * E[p_i] = α_i / α_0
   */
  mean(typeId: string): number {
    if (this.alphaSum === 0) return 0;
    const alpha = this.alphas.get(typeId) ?? 0;
    return alpha / this.alphaSum;
  }

  /**
   * Get the variance for a type's probability
   *
   * Var[p_i] = α_i(α_0 - α_i) / (α_0² (α_0 + 1))
   */
  variance(typeId: string): number {
    if (this.alphaSum === 0 || this.alphaSum === 1) return 0;
    const alpha = this.alphas.get(typeId) ?? 0;
    return (
      (alpha * (this.alphaSum - alpha)) / (this.alphaSum * this.alphaSum * (this.alphaSum + 1))
    );
  }

  /**
   * Get the mode (most likely value) for a type's probability
   *
   * Mode[p_i] = (α_i - 1) / (α_0 - K) for α_i > 1
   * where K is the number of categories
   */
  mode(typeId: string): number {
    const K = this.alphas.size;
    if (this.alphaSum <= K) return this.mean(typeId);
    const alpha = this.alphas.get(typeId) ?? 0;
    if (alpha <= 1) return 0;
    return (alpha - 1) / (this.alphaSum - K);
  }

  /**
   * Compute confidence interval using Beta approximation
   *
   * For a single component, p_i ~ Beta(α_i, α_0 - α_i) marginally
   */
  confidenceInterval(typeId: string, level: number = 0.95): ConfidenceInterval {
    const alpha = this.alphas.get(typeId) ?? 0;
    const beta = this.alphaSum - alpha;

    if (alpha === 0 || beta === 0) {
      return { lower: alpha > 0 ? 1 : 0, upper: alpha > 0 ? 1 : 0, level };
    }

    // Use normal approximation for Beta distribution
    // For large α, β: Beta(α, β) ≈ Normal(μ, σ²)
    const mean = alpha / this.alphaSum;
    const variance = (alpha * beta) / (this.alphaSum * this.alphaSum * (this.alphaSum + 1));
    const std = Math.sqrt(variance);

    // z-score for confidence level
    const z = this.normalQuantile((1 + level) / 2);

    return {
      lower: Math.max(0, mean - z * std),
      upper: Math.min(1, mean + z * std),
      level,
    };
  }

  /**
   * Approximate inverse normal CDF using Acklam's algorithm
   */
  private normalQuantile(p: number): number {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;

    // Coefficients for rational approximation
    const a = [
      -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
      -3.066479806614716e1, 2.506628277459239,
    ];
    const b = [
      -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
      -1.328068155288572e1,
    ];
    const c = [
      -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
      4.374664141464968, 2.938163982698783,
    ];
    const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];

    const pLow = 0.02425;
    const pHigh = 1 - pLow;
    let q: number, r: number;

    if (p < pLow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (
        (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
        ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
      );
    } else if (p <= pHigh) {
      q = p - 0.5;
      r = q * q;
      return (
        ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q) /
        (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1)
      );
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return (
        -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
        ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
      );
    }
  }

  /**
   * Get the entropy of the distribution (uncertainty measure)
   *
   * Higher entropy = more uncertainty about the type
   */
  entropy(): number {
    if (this.alphaSum === 0) return 0;

    let H = 0;
    for (const alpha of this.alphas.values()) {
      const p = alpha / this.alphaSum;
      if (p > 0) {
        H -= p * Math.log2(p);
      }
    }
    return H;
  }

  /**
   * Get all type beliefs sorted by probability
   */
  getBeliefs(confidenceLevel: number = 0.95): TypeBelief[] {
    const beliefs: TypeBelief[] = [];

    for (const typeId of this.alphas.keys()) {
      beliefs.push({
        typeId,
        probability: this.mean(typeId),
        variance: this.variance(typeId),
        confidence: this.confidenceInterval(typeId, confidenceLevel),
        effectiveSampleSize: this.alphas.get(typeId) ?? 0,
      });
    }

    // Sort by probability descending
    beliefs.sort((a, b) => b.probability - a.probability);
    return beliefs;
  }

  /**
   * Get the most likely type
   */
  getMostLikely(): string | undefined {
    let maxProb = -1;
    let maxType: string | undefined;

    for (const typeId of this.alphas.keys()) {
      const prob = this.mean(typeId);
      if (prob > maxProb) {
        maxProb = prob;
        maxType = typeId;
      }
    }

    return maxType;
  }

  /**
   * Get the effective sample size (sum of alphas - prior)
   */
  getEffectiveSampleSize(): number {
    return this.alphaSum;
  }

  /**
   * Get the dimension (number of types)
   */
  get dimension(): number {
    return this.alphas.size;
  }

  /**
   * Get all type IDs in the distribution
   */
  getTypeIds(): string[] {
    return [...this.alphas.keys()];
  }

  /**
   * Clone the distribution
   */
  clone(): DirichletDistribution {
    return new DirichletDistribution(this.alphas);
  }

  /**
   * Merge with another distribution (average the alphas)
   */
  merge(other: DirichletDistribution, weight: number = 0.5): DirichletDistribution {
    const merged = new Map<string, number>();

    // Get all type IDs from both distributions
    const allTypes = new Set([...this.alphas.keys(), ...other.alphas.keys()]);

    for (const typeId of allTypes) {
      const alpha1 = this.alphas.get(typeId) ?? 0;
      const alpha2 = other.alphas.get(typeId) ?? 0;
      merged.set(typeId, weight * alpha1 + (1 - weight) * alpha2);
    }

    return new DirichletDistribution(merged);
  }

  /**
   * Serialize to JSON
   */
  toJSON(): object {
    return {
      alphas: Object.fromEntries(this.alphas),
      alphaSum: this.alphaSum,
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json: { alphas: Record<string, number> }): DirichletDistribution {
    return new DirichletDistribution(new Map(Object.entries(json.alphas)));
  }
}
