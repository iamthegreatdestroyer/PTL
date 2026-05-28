import { describe, it, expect, beforeEach } from 'vitest';
import { TypeLattice } from '../lattice/type-lattice.js';

describe('TypeLattice', () => {
  let lattice: TypeLattice;

  beforeEach(() => {
    lattice = new TypeLattice({ includeStdlib: true });
  });

  describe('initialization', () => {
    it('should create top and bottom types', () => {
      expect(lattice.getType(lattice.TOP)).toBeDefined();
      expect(lattice.getType(lattice.BOTTOM)).toBeDefined();
    });

    it('should create primitive types with stdlib', () => {
      expect(lattice.getType('type:string')).toBeDefined();
      expect(lattice.getType('type:number')).toBeDefined();
      expect(lattice.getType('type:boolean')).toBeDefined();
    });

    it('should skip primitives without stdlib', () => {
      const bare = new TypeLattice({ includeStdlib: false });
      expect(bare.getType('type:string')).toBeUndefined();
      expect(bare.getType(bare.TOP)).toBeDefined();
    });

    it('should expose all types via getAllTypes', () => {
      const all = lattice.getAllTypes();
      expect(all.length).toBeGreaterThan(2);
    });
  });

  describe('subtype relationships', () => {
    it('should establish primitive <: top', () => {
      expect(lattice.isSubtypeOf('type:string', lattice.TOP)).toBe(true);
      expect(lattice.isSubtypeOf('type:number', lattice.TOP)).toBe(true);
    });

    it('should establish bottom <: primitive', () => {
      expect(lattice.isSubtypeOf(lattice.BOTTOM, 'type:string')).toBe(true);
      expect(lattice.isSubtypeOf(lattice.BOTTOM, 'type:number')).toBe(true);
    });

    it('should not allow primitive <: other primitive', () => {
      expect(lattice.isSubtypeOf('type:string', 'type:number')).toBe(false);
      expect(lattice.isSubtypeOf('type:number', 'type:string')).toBe(false);
    });

    it('should handle reflexive case: A <: A', () => {
      expect(lattice.isSubtypeOf('type:string', 'type:string')).toBe(true);
    });

    it('should return false for unknown types', () => {
      expect(lattice.isSubtypeOf('nonexistent', 'type:string')).toBe(false);
    });
  });

  describe('addType', () => {
    it('should add a custom type', () => {
      lattice.addType({
        id: 'type:custom',
        name: 'Custom',
        kind: 'class',
        parents: new Set(),
        children: new Set(),
        metadata: { isBuiltin: false },
      });
      expect(lattice.getType('type:custom')).toBeDefined();
    });

    it('should throw on duplicate add', () => {
      expect(() =>
        lattice.addType({
          id: 'type:string',
          name: 'string',
          kind: 'primitive',
          parents: new Set(),
          children: new Set(),
          metadata: { isBuiltin: true },
        })
      ).toThrow();
    });
  });

  describe('addRelation', () => {
    it('should add subtype edges', () => {
      lattice.addType({
        id: 'type:int',
        name: 'int',
        kind: 'primitive',
        parents: new Set(),
        children: new Set(),
        metadata: { isBuiltin: false },
      });
      lattice.addRelation({ subtype: 'type:int', supertype: 'type:number' });
      expect(lattice.isSubtypeOf('type:int', 'type:number')).toBe(true);
    });

    it('should support transitive subtyping', () => {
      lattice.addType({
        id: 'type:int',
        name: 'int',
        kind: 'primitive',
        parents: new Set(),
        children: new Set(),
        metadata: { isBuiltin: false },
      });
      lattice.addRelation({ subtype: 'type:int', supertype: 'type:number' });
      // int <: number <: top → int <: top
      expect(lattice.isSubtypeOf('type:int', lattice.TOP)).toBe(true);
    });
  });

  describe('join (least upper bound)', () => {
    it('should return same type for identical inputs', () => {
      const result = lattice.join('type:string', 'type:string');
      expect(result).toBe('type:string');
    });

    it('should return a common ancestor for unrelated primitives', () => {
      const result = lattice.join('type:string', 'type:number');
      expect(result).toBeDefined();
      expect(lattice.isSubtypeOf('type:string', result)).toBe(true);
      expect(lattice.isSubtypeOf('type:number', result)).toBe(true);
    });

    it('should return supertype when one is subtype of other', () => {
      const result = lattice.join(lattice.BOTTOM, 'type:string');
      expect(result).toBe('type:string');
    });
  });

  describe('meet (greatest lower bound)', () => {
    it('should return same type for identical inputs', () => {
      const result = lattice.meet('type:string', 'type:string');
      expect(result).toBe('type:string');
    });

    it('should return bottom for unrelated primitives', () => {
      const result = lattice.meet('type:string', 'type:number');
      expect(result).toBe(lattice.BOTTOM);
    });

    it('should return subtype when one is subtype of other', () => {
      const result = lattice.meet(lattice.TOP, 'type:string');
      expect(result).toBe('type:string');
    });
  });

  describe('getAncestors / getDescendants', () => {
    it('should return ancestors of a primitive', () => {
      const ancestors = lattice.getAncestors('type:string');
      expect(ancestors.has(lattice.TOP)).toBe(true);
    });

    it('should return descendants of top', () => {
      const descendants = lattice.getDescendants(lattice.TOP);
      expect(descendants.size).toBeGreaterThan(0);
    });

    it('should return empty for bottom descendants', () => {
      const descendants = lattice.getDescendants(lattice.BOTTOM);
      expect(descendants.size).toBe(0);
    });
  });

  describe('walk', () => {
    it('should walk up from a type', () => {
      const visited = lattice.walk('type:string', {
        direction: 'up',
        maxDepth: 5,
        includeStart: true,
      });
      const ids = visited.map((n) => n.id);
      expect(ids).toContain('type:string');
      expect(ids).toContain(lattice.TOP);
    });

    it('should walk down from top', () => {
      const visited = lattice.walk(lattice.TOP, {
        direction: 'down',
        maxDepth: 1,
        includeStart: false,
      });
      expect(visited.length).toBeGreaterThan(0);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const json = lattice.toJSON() as Record<string, unknown>;
      expect(json).toHaveProperty('config');
      expect(json).toHaveProperty('nodes');
    });
  });
});
