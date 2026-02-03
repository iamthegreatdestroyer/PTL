/**
 * Type definitions for the Type Lattice module
 */

/**
 * Represents a node in the type lattice
 */
export interface TypeNode {
  /** Unique identifier for this type */
  readonly id: string;

  /** Human-readable name */
  readonly name: string;

  /** The kind of type (primitive, compound, literal, etc.) */
  readonly kind: TypeKind;

  /** Parent types (supertypes) in the lattice */
  readonly parents: ReadonlySet<string>;

  /** Child types (subtypes) in the lattice */
  readonly children: ReadonlySet<string>;

  /** Additional metadata for the type */
  readonly metadata: TypeMetadata;
}

/**
 * Kind of type in the lattice
 */
export type TypeKind =
  | 'top' // ⊤ (unknown)
  | 'bottom' // ⊥ (never)
  | 'primitive' // string, number, boolean, etc.
  | 'literal' // "hello", 42, true
  | 'union' // A | B
  | 'intersection' // A & B
  | 'array' // T[]
  | 'tuple' // [A, B, C]
  | 'object' // { key: Type }
  | 'function' // (args) => return
  | 'class' // class instances
  | 'generic' // T, K, etc.
  | 'conditional' // T extends U ? X : Y
  | 'mapped' // { [K in Keys]: Type }
  | 'template-literal'; // `${A}${B}`

/**
 * Metadata associated with a type node
 */
export interface TypeMetadata {
  /** Whether this is a built-in TypeScript type */
  readonly isBuiltin: boolean;

  /** Source location where this type is defined */
  readonly definedAt?: SourceLocation;

  /** Documentation string */
  readonly documentation?: string;

  /** For literals, the actual value */
  readonly literalValue?: unknown;

  /** For generics, the constraint */
  readonly constraint?: string;

  /** For functions, parameter and return type IDs */
  readonly signature?: FunctionSignature;

  /** For objects, the property types */
  readonly properties?: ReadonlyMap<string, string>;

  /** For arrays/tuples, the element type(s) */
  readonly elementTypes?: readonly string[];
}

/**
 * Source location for a type definition
 */
export interface SourceLocation {
  readonly file: string;
  readonly line: number;
  readonly column: number;
}

/**
 * Function signature representation
 */
export interface FunctionSignature {
  readonly parameters: readonly ParameterInfo[];
  readonly returnType: string;
  readonly typeParameters?: readonly string[];
}

/**
 * Parameter information
 */
export interface ParameterInfo {
  readonly name: string;
  readonly typeId: string;
  readonly optional: boolean;
  readonly rest: boolean;
}

/**
 * Represents a relation between two types in the lattice
 */
export interface TypeRelation {
  /** The subtype */
  readonly subtype: string;

  /** The supertype */
  readonly supertype: string;

  /** The kind of relation */
  readonly kind: RelationKind;

  /** Confidence in this relation (for inferred relations) */
  readonly confidence: number;
}

/**
 * Kind of relation between types
 */
export type RelationKind =
  | 'subtype' // A <: B (A is subtype of B)
  | 'equivalent' // A ≡ B (A and B are equivalent)
  | 'compatible' // A ~ B (A is assignable to B)
  | 'disjoint'; // A ∩ B = ⊥ (A and B have no common subtypes)

/**
 * Configuration for the type lattice
 */
export interface LatticeConfig {
  /** Whether to include TypeScript stdlib types */
  readonly includeStdlib: boolean;

  /** Maximum depth for compound types */
  readonly maxDepth: number;

  /** Whether to enable strict mode (no implicit any) */
  readonly strict: boolean;

  /** Custom type definitions to include */
  readonly customTypes?: readonly TypeNode[];
}

/**
 * Options for walking the lattice
 */
export interface LatticeWalkOptions {
  /** Direction to walk: up (to supertypes) or down (to subtypes) */
  readonly direction: 'up' | 'down';

  /** Maximum depth to walk */
  readonly maxDepth: number;

  /** Whether to include the starting node */
  readonly includeStart: boolean;

  /** Filter function for nodes */
  readonly filter?: (node: TypeNode) => boolean;
}

/**
 * Result of a lattice operation
 */
export interface LatticeOperationResult {
  /** The resulting type ID */
  readonly typeId: string;

  /** Whether a new type was created */
  readonly created: boolean;

  /** The type node */
  readonly node: TypeNode;
}
