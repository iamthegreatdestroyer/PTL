/**
 * Type Prior Types
 *
 * Type definitions for prior data structures.
 */

/**
 * Type frequency data
 * Represents how often a type appears in analyzed codebases
 */
export interface TypeFrequency {
  /**
   * Type name
   */
  readonly type: string;

  /**
   * Occurrence count
   */
  readonly count: number;

  /**
   * Normalized probability (0-1)
   */
  readonly probability: number;

  /**
   * Standard error of the estimate
   */
  readonly stderr: number;
}

/**
 * Type transition matrix
 * Represents P(new_type | old_type) for type updates
 */
export interface TransitionMatrix {
  /**
   * Source type
   */
  readonly from: string;

  /**
   * Transition probabilities to each target type
   */
  readonly transitions: ReadonlyArray<{
    readonly to: string;
    readonly probability: number;
  }>;
}

/**
 * Context pattern for contextual priors
 */
export interface ContextPattern {
  /**
   * Pattern identifier
   */
  readonly id: string;

  /**
   * Pattern description
   */
  readonly description: string;

  /**
   * Context indicators
   */
  readonly indicators: ReadonlyArray<{
    readonly type: 'identifier' | 'parent' | 'returnType' | 'paramType';
    readonly pattern: string;
    readonly weight: number;
  }>;

  /**
   * Type probabilities when this context is detected
   */
  readonly typeProbabilities: ReadonlyArray<{
    readonly type: string;
    readonly probability: number;
  }>;
}

/**
 * Configuration for prior loading
 */
export interface PriorConfig {
  /**
   * Include standard library types
   * @default true
   */
  readonly includeStdlib: boolean;

  /**
   * Include DOM types
   * @default false
   */
  readonly includeDom: boolean;

  /**
   * Custom priors file path
   */
  readonly customPath?: string;

  /**
   * Prior strength (alpha for Dirichlet)
   * @default 1.0
   */
  readonly strength: number;
}

/**
 * Category of type for grouping
 */
export type TypeCategory =
  | 'primitive'
  | 'builtin'
  | 'collection'
  | 'promise'
  | 'function'
  | 'class'
  | 'interface'
  | 'union'
  | 'intersection'
  | 'generic'
  | 'literal'
  | 'unknown';

/**
 * Type metadata
 */
export interface TypeMetadata {
  /**
   * Type name
   */
  readonly name: string;

  /**
   * Category
   */
  readonly category: TypeCategory;

  /**
   * Is this a generic type
   */
  readonly isGeneric: boolean;

  /**
   * Type parameters (if generic)
   */
  readonly typeParams?: readonly string[];

  /**
   * Parent types in the lattice
   */
  readonly parents?: readonly string[];
}
