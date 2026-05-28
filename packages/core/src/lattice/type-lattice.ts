/**
 * Type Lattice Implementation
 *
 * The type lattice is a partially ordered set of types with:
 * - Join (⊔): Least upper bound (union-like)
 * - Meet (⊓): Greatest lower bound (intersection-like)
 * - Top (⊤): The supremum (unknown/any)
 * - Bottom (⊥): The infimum (never)
 */

import type {
  TypeNode,
  TypeRelation,
  LatticeConfig,
  LatticeWalkOptions,
  LatticeOperationResult,
} from './types.js';

/**
 * Default configuration for the type lattice
 */
const DEFAULT_CONFIG: LatticeConfig = {
  includeStdlib: true,
  maxDepth: 10,
  strict: true,
};

/**
 * Type Lattice data structure
 *
 * Represents the hierarchical relationship between types as a lattice
 * with partial ordering based on subtype relationships.
 */
export class TypeLattice {
  /** All type nodes in the lattice */
  private readonly nodes: Map<string, TypeNode> = new Map();

  /** Adjacency list for subtype relations (child -> parents) */
  private readonly subtypeOf: Map<string, Set<string>> = new Map();

  /** Adjacency list for supertype relations (parent -> children) */
  private readonly supertypeOf: Map<string, Set<string>> = new Map();

  /** Configuration */
  private readonly config: LatticeConfig;

  /** The top type (⊤) ID */
  public readonly TOP: string = 'type:top';

  /** The bottom type (⊥) ID */
  public readonly BOTTOM: string = 'type:bottom';

  constructor(config: Partial<LatticeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeLattice();
  }

  /**
   * Initialize the lattice with top and bottom types
   */
  private initializeLattice(): void {
    // Add top type (⊤)
    this.addType({
      id: this.TOP,
      name: 'unknown',
      kind: 'top',
      parents: new Set(),
      children: new Set(),
      metadata: { isBuiltin: true },
    });

    // Add bottom type (⊥)
    this.addType({
      id: this.BOTTOM,
      name: 'never',
      kind: 'bottom',
      parents: new Set(),
      children: new Set(),
      metadata: { isBuiltin: true },
    });

    // Add primitive types if stdlib is enabled
    if (this.config.includeStdlib) {
      this.initializeStdlibTypes();
    }

    // Add custom types
    if (this.config.customTypes) {
      for (const type of this.config.customTypes) {
        this.addType(type);
      }
    }
  }

  /**
   * Initialize TypeScript stdlib types
   */
  private initializeStdlibTypes(): void {
    // Primitive types
    const primitives: Array<{ id: string; name: string }> = [
      { id: 'type:string', name: 'string' },
      { id: 'type:number', name: 'number' },
      { id: 'type:boolean', name: 'boolean' },
      { id: 'type:symbol', name: 'symbol' },
      { id: 'type:bigint', name: 'bigint' },
      { id: 'type:undefined', name: 'undefined' },
      { id: 'type:null', name: 'null' },
      { id: 'type:void', name: 'void' },
      { id: 'type:object', name: 'object' },
      { id: 'type:array', name: 'Array' },
      { id: 'type:function', name: 'Function' },
    ];

    for (const { id, name } of primitives) {
      this.addType({
        id,
        name,
        kind: 'primitive',
        parents: new Set([this.TOP]),
        children: new Set([this.BOTTOM]),
        metadata: { isBuiltin: true },
      });

      // Add relations
      this.addRelation({ subtype: id, supertype: this.TOP, kind: 'subtype', confidence: 1.0 });
      this.addRelation({ subtype: this.BOTTOM, supertype: id, kind: 'subtype', confidence: 1.0 });
    }

    // Boolean literals
    this.addLiteralTypes('type:boolean', [
      { id: 'type:true', name: 'true', value: true },
      { id: 'type:false', name: 'false', value: false },
    ]);
  }

  /**
   * Add literal types as subtypes of a primitive
   */
  private addLiteralTypes(
    parentId: string,
    literals: Array<{ id: string; name: string; value: unknown }>
  ): void {
    for (const { id, name, value } of literals) {
      this.addType({
        id,
        name,
        kind: 'literal',
        parents: new Set([parentId]),
        children: new Set([this.BOTTOM]),
        metadata: { isBuiltin: true, literalValue: value },
      });

      this.addRelation({ subtype: id, supertype: parentId, kind: 'subtype', confidence: 1.0 });
      this.addRelation({ subtype: this.BOTTOM, supertype: id, kind: 'subtype', confidence: 1.0 });
    }
  }

  /**
   * Add a type to the lattice
   */
  addType(node: TypeNode): void {
    if (this.nodes.has(node.id)) {
      throw new Error(`Type ${node.id} already exists in the lattice`);
    }

    this.nodes.set(node.id, node);
    this.subtypeOf.set(node.id, new Set(node.parents));
    this.supertypeOf.set(node.id, new Set(node.children));
  }

  /**
   * Add a relation between types
   */
  addRelation(relation: TypeRelation): void {
    const { subtype, supertype } = relation;

    // Update adjacency lists
    const subtypeParents = this.subtypeOf.get(subtype);
    if (subtypeParents) {
      subtypeParents.add(supertype);
    }

    const supertypeChildren = this.supertypeOf.get(supertype);
    if (supertypeChildren) {
      supertypeChildren.add(subtype);
    }
  }

  /**
   * Get a type node by ID
   */
  getType(id: string): TypeNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Check if a type exists in the lattice
   */
  hasType(id: string): boolean {
    return this.nodes.has(id);
  }

  /**
   * Check if `a` is a subtype of `b`
   */
  isSubtypeOf(a: string, b: string): boolean {
    if (a === b) return true;
    if (a === this.BOTTOM) return true;
    if (b === this.TOP) return true;

    // BFS to find if there's a path from a to b going up
    const visited = new Set<string>();
    const queue: string[] = [a];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === b) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      const parents = this.subtypeOf.get(current);
      if (parents) {
        for (const parent of parents) {
          if (!visited.has(parent)) {
            queue.push(parent);
          }
        }
      }
    }

    return false;
  }

  /**
   * Compute the join (least upper bound) of two types
   * This is like a union - the smallest type that is a supertype of both
   */
  join(a: string, b: string): string {
    if (a === b) return a;
    if (this.isSubtypeOf(a, b)) return b;
    if (this.isSubtypeOf(b, a)) return a;

    // Find common ancestors and return the most specific one
    const ancestorsA = this.getAncestors(a);
    const ancestorsB = this.getAncestors(b);

    // Find common ancestors
    const common = new Set<string>();
    for (const ancestor of ancestorsA) {
      if (ancestorsB.has(ancestor)) {
        common.add(ancestor);
      }
    }

    if (common.size === 0) {
      return this.TOP;
    }

    // Find the most specific common ancestor (one with no other common ancestors below it)
    let mostSpecific = this.TOP;
    for (const candidate of common) {
      if (this.isSubtypeOf(candidate, mostSpecific) && candidate !== mostSpecific) {
        mostSpecific = candidate;
      }
    }

    return mostSpecific;
  }

  /**
   * Compute the meet (greatest lower bound) of two types
   * This is like an intersection - the largest type that is a subtype of both
   */
  meet(a: string, b: string): string {
    if (a === b) return a;
    if (this.isSubtypeOf(a, b)) return a;
    if (this.isSubtypeOf(b, a)) return b;

    // Find common descendants and return the most general one
    const descendantsA = this.getDescendants(a);
    const descendantsB = this.getDescendants(b);

    // Find common descendants
    const common = new Set<string>();
    for (const descendant of descendantsA) {
      if (descendantsB.has(descendant)) {
        common.add(descendant);
      }
    }

    if (common.size === 0) {
      return this.BOTTOM;
    }

    // Find the most general common descendant
    let mostGeneral = this.BOTTOM;
    for (const candidate of common) {
      if (this.isSubtypeOf(mostGeneral, candidate) && candidate !== mostGeneral) {
        mostGeneral = candidate;
      }
    }

    return mostGeneral;
  }

  /**
   * Get all ancestors (supertypes) of a type
   */
  getAncestors(id: string): Set<string> {
    const ancestors = new Set<string>();
    const queue: string[] = [id];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const parents = this.subtypeOf.get(current);
      if (parents) {
        for (const parent of parents) {
          if (!ancestors.has(parent)) {
            ancestors.add(parent);
            queue.push(parent);
          }
        }
      }
    }

    return ancestors;
  }

  /**
   * Get all descendants (subtypes) of a type
   */
  getDescendants(id: string): Set<string> {
    const descendants = new Set<string>();
    const queue: string[] = [id];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = this.supertypeOf.get(current);
      if (children) {
        for (const child of children) {
          if (!descendants.has(child)) {
            descendants.add(child);
            queue.push(child);
          }
        }
      }
    }

    return descendants;
  }

  /**
   * Walk the lattice from a starting type
   */
  walk(startId: string, options: Partial<LatticeWalkOptions> = {}): TypeNode[] {
    const opts: LatticeWalkOptions = {
      direction: 'up',
      maxDepth: this.config.maxDepth,
      includeStart: true,
      ...options,
    };

    const result: TypeNode[] = [];
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;

      if (visited.has(id) || depth > opts.maxDepth) continue;
      visited.add(id);

      const node = this.nodes.get(id);
      if (!node) continue;

      if (depth === 0 && !opts.includeStart) {
        // Skip start but continue walking
      } else if (!opts.filter || opts.filter(node)) {
        result.push(node);
      }

      // Get neighbors based on direction
      const neighbors = opts.direction === 'up' ? this.subtypeOf.get(id) : this.supertypeOf.get(id);

      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push({ id: neighbor, depth: depth + 1 });
          }
        }
      }
    }

    return result;
  }

  /**
   * Create or get a union type
   */
  createUnion(types: string[]): LatticeOperationResult {
    if (types.length === 0) {
      return { typeId: this.BOTTOM, created: false, node: this.nodes.get(this.BOTTOM)! };
    }
    if (types.length === 1) {
      return { typeId: types[0]!, created: false, node: this.nodes.get(types[0]!)! };
    }

    // Normalize and deduplicate
    const normalized = [...new Set(types)].sort();
    const id = `type:union(${normalized.join('|')})`;

    if (this.nodes.has(id)) {
      return { typeId: id, created: false, node: this.nodes.get(id)! };
    }

    // Create union type
    const node: TypeNode = {
      id,
      name: normalized.map((t) => this.nodes.get(t)?.name ?? t).join(' | '),
      kind: 'union',
      parents: new Set([this.TOP]),
      children: new Set(types),
      metadata: { isBuiltin: false },
    };

    this.addType(node);

    // Add relations
    for (const type of types) {
      this.addRelation({ subtype: type, supertype: id, kind: 'subtype', confidence: 1.0 });
    }

    return { typeId: id, created: true, node };
  }

  /**
   * Create or get an intersection type
   */
  createIntersection(types: string[]): LatticeOperationResult {
    if (types.length === 0) {
      return { typeId: this.TOP, created: false, node: this.nodes.get(this.TOP)! };
    }
    if (types.length === 1) {
      return { typeId: types[0]!, created: false, node: this.nodes.get(types[0]!)! };
    }

    // Normalize and deduplicate
    const normalized = [...new Set(types)].sort();
    const id = `type:intersection(${normalized.join('&')})`;

    if (this.nodes.has(id)) {
      return { typeId: id, created: false, node: this.nodes.get(id)! };
    }

    // Create intersection type
    const node: TypeNode = {
      id,
      name: normalized.map((t) => this.nodes.get(t)?.name ?? t).join(' & '),
      kind: 'intersection',
      parents: new Set(types),
      children: new Set([this.BOTTOM]),
      metadata: { isBuiltin: false },
    };

    this.addType(node);

    // Add relations
    for (const type of types) {
      this.addRelation({ subtype: id, supertype: type, kind: 'subtype', confidence: 1.0 });
    }

    return { typeId: id, created: true, node };
  }

  /**
   * Get the number of types in the lattice
   */
  get size(): number {
    return this.nodes.size;
  }

  /**
   * Get all type IDs
   */
  getAllTypeIds(): string[] {
    return [...this.nodes.keys()];
  }

  /**
   * Get all type nodes
   */
  getAllTypes(): TypeNode[] {
    return [...this.nodes.values()];
  }

  /**
   * Serialize the lattice to JSON
   */
  toJSON(): object {
    return {
      config: this.config,
      nodes: [...this.nodes.entries()].map(([_id, node]) => ({
        ...node,
        parents: [...node.parents],
        children: [...node.children],
      })),
    };
  }
}

/**
 * Factory function to create a TypeLattice
 */
export function createTypeLattice(config: Partial<LatticeConfig> = {}): TypeLattice {
  return new TypeLattice(config);
}
