import { describe, it, expect, beforeEach } from 'vitest';
import { TypeLattice } from '../TypeLattice';

describe('TypeLattice', () => {
  let lattice: TypeLattice;

  beforeEach(() => {
    lattice = new TypeLattice();
  });

  describe('basic type operations', () => {
    it('should create lattice with base types', () => {
      expect(lattice.hasType('unknown')).toBe(true);
      expect(lattice.hasType('never')).toBe(true);
      expect(lattice.hasType('any')).toBe(true);
    });

    it('should add primitive types', () => {
      lattice.addType('string');
      lattice.addType('number');
      lattice.addType('boolean');

      expect(lattice.hasType('string')).toBe(true);
      expect(lattice.hasType('number')).toBe(true);
      expect(lattice.hasType('boolean')).toBe(true);
    });

    it('should establish subtype relationships', () => {
      lattice.addType('string');
      lattice.addSubtypeRelation('string', 'unknown');

      expect(lattice.isSubtype('string', 'unknown')).toBe(true);
      expect(lattice.isSubtype('unknown', 'string')).toBe(false);
    });
  });

  describe('join operation (least upper bound)', () => {
    beforeEach(() => {
      lattice.addType('string');
      lattice.addType('number');
      lattice.addType('boolean');
      lattice.addSubtypeRelation('string', 'unknown');
      lattice.addSubtypeRelation('number', 'unknown');
      lattice.addSubtypeRelation('boolean', 'unknown');
    });

    it('should compute join of identical types', () => {
      expect(lattice.join('string', 'string')).toBe('string');
    });

    it('should compute join of different primitives as union', () => {
      const result = lattice.join('string', 'number');
      expect(result).toContain('string');
      expect(result).toContain('number');
    });

    it('should return supertype when one is subtype of other', () => {
      expect(lattice.join('string', 'unknown')).toBe('unknown');
    });
  });

  describe('meet operation (greatest lower bound)', () => {
    beforeEach(() => {
      lattice.addType('string');
      lattice.addType('number');
      lattice.addSubtypeRelation('never', 'string');
      lattice.addSubtypeRelation('never', 'number');
    });

    it('should compute meet of identical types', () => {
      expect(lattice.meet('string', 'string')).toBe('string');
    });

    it('should compute meet of unrelated types as never', () => {
      expect(lattice.meet('string', 'number')).toBe('never');
    });

    it('should return subtype when one is subtype of other', () => {
      lattice.addType('literal_hello');
      lattice.addSubtypeRelation('literal_hello', 'string');
      expect(lattice.meet('literal_hello', 'string')).toBe('literal_hello');
    });
  });

  describe('union types', () => {
    it('should create union types', () => {
      lattice.addType('string');
      lattice.addType('number');

      const union = lattice.createUnion(['string', 'number']);
      expect(union).toBeDefined();
      expect(lattice.hasType(union)).toBe(true);
    });

    it('should flatten nested unions', () => {
      lattice.addType('string');
      lattice.addType('number');
      lattice.addType('boolean');

      const union1 = lattice.createUnion(['string', 'number']);
      const union2 = lattice.createUnion([union1, 'boolean']);

      // Should contain all three primitive types
      expect(lattice.getUnionMembers(union2)).toHaveLength(3);
    });

    it('should deduplicate union members', () => {
      lattice.addType('string');

      const union = lattice.createUnion(['string', 'string', 'string']);
      expect(lattice.getUnionMembers(union)).toHaveLength(1);
    });
  });

  describe('intersection types', () => {
    it('should create intersection types', () => {
      lattice.addType('{ name: string }');
      lattice.addType('{ age: number }');

      const intersection = lattice.createIntersection(['{ name: string }', '{ age: number }']);
      expect(intersection).toBeDefined();
    });

    it('should handle intersection with never', () => {
      lattice.addType('string');

      const intersection = lattice.createIntersection(['string', 'never']);
      expect(intersection).toBe('never');
    });
  });

  describe('type distance', () => {
    beforeEach(() => {
      lattice.addType('string');
      lattice.addType('number');
      lattice.addType('literal_hello');
      lattice.addSubtypeRelation('literal_hello', 'string');
      lattice.addSubtypeRelation('string', 'unknown');
      lattice.addSubtypeRelation('number', 'unknown');
    });

    it('should return 0 for identical types', () => {
      expect(lattice.typeDistance('string', 'string')).toBe(0);
    });

    it('should return 1 for direct subtypes', () => {
      expect(lattice.typeDistance('literal_hello', 'string')).toBe(1);
    });

    it('should return path length for transitive subtypes', () => {
      expect(lattice.typeDistance('literal_hello', 'unknown')).toBe(2);
    });

    it('should return Infinity for unrelated types', () => {
      expect(lattice.typeDistance('string', 'number')).toBe(Infinity);
    });
  });

  describe('serialization', () => {
    beforeEach(() => {
      lattice.addType('string');
      lattice.addType('number');
      lattice.addSubtypeRelation('string', 'unknown');
    });

    it('should serialize to JSON', () => {
      const json = lattice.toJSON();
      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
    });

    it('should deserialize from JSON', () => {
      const json = lattice.toJSON();
      const restored = TypeLattice.fromJSON(json);

      expect(restored.hasType('string')).toBe(true);
      expect(restored.hasType('number')).toBe(true);
      expect(restored.isSubtype('string', 'unknown')).toBe(true);
    });
  });
});
