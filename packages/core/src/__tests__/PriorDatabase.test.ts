import { describe, it, expect, beforeEach } from 'vitest';
import { PriorDatabase } from '../PriorDatabase';

describe('PriorDatabase', () => {
  let db: PriorDatabase;

  beforeEach(() => {
    db = new PriorDatabase();
  });

  describe('initialization', () => {
    it('should create empty database', () => {
      expect(db.size()).toBe(0);
    });

    it('should load default priors', () => {
      db.loadDefaults();
      expect(db.size()).toBeGreaterThan(0);
    });
  });

  describe('prior management', () => {
    it('should add a prior', () => {
      db.addPrior({
        pattern: 'isXxx',
        type: 'boolean',
        confidence: 0.85,
        source: 'naming_convention',
      });

      expect(db.size()).toBe(1);
    });

    it('should retrieve priors by pattern', () => {
      db.addPrior({
        pattern: 'isActive',
        type: 'boolean',
        confidence: 0.85,
        source: 'naming_convention',
      });

      const priors = db.getPriorsByPattern('isActive');
      expect(priors).toHaveLength(1);
      expect(priors[0].type).toBe('boolean');
    });

    it('should support regex patterns', () => {
      db.addPrior({
        pattern: /^is[A-Z]/,
        type: 'boolean',
        confidence: 0.8,
        source: 'naming_convention',
      });

      const priors = db.matchPriors('isEnabled');
      expect(priors.length).toBeGreaterThan(0);
    });
  });

  describe('naming convention priors', () => {
    beforeEach(() => {
      db.loadDefaults();
    });

    it('should match boolean naming patterns', () => {
      const patterns = ['isActive', 'hasPermission', 'canEdit', 'shouldUpdate'];

      for (const pattern of patterns) {
        const priors = db.matchPriors(pattern);
        const booleanPrior = priors.find((p) => p.type === 'boolean');
        expect(booleanPrior, `Expected boolean prior for "${pattern}"`).toBeDefined();
      }
    });

    it('should match numeric naming patterns', () => {
      const patterns = ['count', 'numItems', 'totalAmount', 'index', 'length'];

      for (const pattern of patterns) {
        const priors = db.matchPriors(pattern);
        const numberPrior = priors.find((p) => p.type === 'number');
        expect(numberPrior, `Expected number prior for "${pattern}"`).toBeDefined();
      }
    });

    it('should match string naming patterns', () => {
      const patterns = ['name', 'title', 'description', 'message', 'label'];

      for (const pattern of patterns) {
        const priors = db.matchPriors(pattern);
        const stringPrior = priors.find((p) => p.type === 'string');
        expect(stringPrior, `Expected string prior for "${pattern}"`).toBeDefined();
      }
    });

    it('should match array naming patterns', () => {
      const patterns = ['items', 'users', 'elements', 'children', 'results'];

      for (const pattern of patterns) {
        const priors = db.matchPriors(pattern);
        const arrayPrior = priors.find((p) => p.type.includes('[]'));
        expect(arrayPrior, `Expected array prior for "${pattern}"`).toBeDefined();
      }
    });
  });

  describe('API pattern priors', () => {
    beforeEach(() => {
      db.loadDefaults();
    });

    it('should have priors for common API patterns', () => {
      const apiPatterns = [
        { name: 'fetch', expectedReturn: 'Promise' },
        { name: 'getElementById', expectedReturn: 'Element' },
        { name: 'querySelector', expectedReturn: 'Element' },
        { name: 'parse', expectedReturn: 'object' },
      ];

      for (const { name } of apiPatterns) {
        const priors = db.matchPriors(name);
        expect(priors.length, `Expected priors for "${name}"`).toBeGreaterThan(0);
      }
    });
  });

  describe('prior combination', () => {
    it('should combine multiple priors with Bayesian update', () => {
      db.addPrior({
        pattern: 'userId',
        type: 'string',
        confidence: 0.7,
        source: 'naming_convention',
      });

      db.addPrior({
        pattern: 'userId',
        type: 'number',
        confidence: 0.6,
        source: 'usage_pattern',
      });

      const combined = db.getCombinedPrior('userId');
      expect(combined).toBeDefined();
      // Combined should reflect uncertainty between string and number
    });

    it('should handle conflicting priors', () => {
      db.addPrior({
        pattern: 'value',
        type: 'string',
        confidence: 0.8,
        source: 'source1',
      });

      db.addPrior({
        pattern: 'value',
        type: 'number',
        confidence: 0.75,
        source: 'source2',
      });

      const priors = db.getPriorsByPattern('value');
      expect(priors).toHaveLength(2);
    });
  });

  describe('persistence', () => {
    it('should export to JSON', () => {
      db.addPrior({
        pattern: 'test',
        type: 'string',
        confidence: 0.85,
        source: 'test',
      });

      const json = db.toJSON();
      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
    });

    it('should import from JSON', () => {
      db.addPrior({
        pattern: 'test',
        type: 'string',
        confidence: 0.85,
        source: 'test',
      });

      const json = db.toJSON();

      const newDb = PriorDatabase.fromJSON(json);
      expect(newDb.size()).toBe(1);
    });

    it('should merge databases', () => {
      const db2 = new PriorDatabase();

      db.addPrior({
        pattern: 'prior1',
        type: 'string',
        confidence: 0.8,
        source: 'db1',
      });

      db2.addPrior({
        pattern: 'prior2',
        type: 'number',
        confidence: 0.75,
        source: 'db2',
      });

      db.merge(db2);

      expect(db.size()).toBe(2);
      expect(db.getPriorsByPattern('prior2')).toHaveLength(1);
    });
  });

  describe('statistics', () => {
    beforeEach(() => {
      db.loadDefaults();
    });

    it('should report statistics', () => {
      const stats = db.getStatistics();

      expect(stats.totalPriors).toBeGreaterThan(0);
      expect(stats.bySource).toBeDefined();
      expect(stats.byType).toBeDefined();
    });

    it('should track prior usage', () => {
      db.recordUsage('isActive', 'boolean', true);
      db.recordUsage('isActive', 'boolean', true);
      db.recordUsage('isActive', 'string', false);

      const stats = db.getUsageStats('isActive');
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });
  });
});
