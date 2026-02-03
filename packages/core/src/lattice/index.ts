/**
 * Type Lattice Module
 *
 * Implements the type lattice data structure representing hierarchical
 * relationships between types. The lattice has:
 * - ⊤ (top/unknown): The supremum - supertype of all types
 * - ⊥ (bottom/never): The infimum - subtype of all types
 * - Primitive types: string, number, boolean, etc.
 * - Compound types: unions, intersections, arrays, objects
 *
 * @packageDocumentation
 */

export { TypeLattice, createTypeLattice } from './type-lattice.js';
export type { TypeNode, TypeRelation, LatticeConfig, LatticeWalkOptions } from './types.js';
