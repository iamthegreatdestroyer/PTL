import { describe, it, expect, beforeEach } from 'vitest';
import { combineEvidence, computeConfidence } from '../confidence';
import type { Evidence } from '../types';

describe('Confidence Calculation', () => {
  describe('computeConfidence', () => {
    it('should compute confidence from single evidence', () => {
      const evidence: Evidence[] = [{ type: 'literal_value', confidence: 0.95, source: 'parser' }];

      const result = computeConfidence(evidence);
      expect(result).toBe(0.95);
    });

    it('should combine multiple evidence sources', () => {
      const evidence: Evidence[] = [
        { type: 'literal_value', confidence: 0.8, source: 'parser' },
        { type: 'naming_convention', confidence: 0.7, source: 'prior' },
      ];

      const result = computeConfidence(evidence);
      // Combined should be higher than any single source
      expect(result).toBeGreaterThan(0.8);
    });

    it('should handle conflicting evidence', () => {
      const evidence: Evidence[] = [
        { type: 'usage_as_string', confidence: 0.8, source: 'analyzer' },
        { type: 'usage_as_number', confidence: 0.75, source: 'analyzer' },
      ];

      const result = computeConfidence(evidence);
      // Conflicting evidence should lower overall confidence
      expect(result).toBeLessThan(0.8);
    });

    it('should return 0 for empty evidence', () => {
      const result = computeConfidence([]);
      expect(result).toBe(0);
    });
  });

  describe('combineEvidence', () => {
    it('should combine non-conflicting evidence', () => {
      const evidenceGroups: Evidence[][] = [
        [{ type: 'literal', confidence: 0.9, source: 'parser' }],
        [{ type: 'naming', confidence: 0.8, source: 'prior' }],
      ];

      const combined = combineEvidence(evidenceGroups);
      expect(combined.length).toBe(2);
    });

    it('should deduplicate identical evidence', () => {
      const evidenceGroups: Evidence[][] = [
        [{ type: 'literal', confidence: 0.9, source: 'parser' }],
        [{ type: 'literal', confidence: 0.9, source: 'parser' }],
      ];

      const combined = combineEvidence(evidenceGroups);
      expect(combined.length).toBe(1);
    });

    it('should keep higher confidence for duplicate types', () => {
      const evidenceGroups: Evidence[][] = [
        [{ type: 'usage', confidence: 0.7, source: 'analyzer' }],
        [{ type: 'usage', confidence: 0.85, source: 'analyzer' }],
      ];

      const combined = combineEvidence(evidenceGroups);
      expect(combined.length).toBe(1);
      expect(combined[0].confidence).toBe(0.85);
    });
  });

  describe('Bayesian combination', () => {
    it('should follow Bayesian probability rules', () => {
      // P(H|E1,E2) should follow Bayes' rule
      const prior = 0.5; // uniform prior
      const likelihood1 = 0.9; // P(E1|H)
      const likelihood2 = 0.8; // P(E2|H)

      const evidence: Evidence[] = [
        { type: 'e1', confidence: likelihood1, source: 'test' },
        { type: 'e2', confidence: likelihood2, source: 'test' },
      ];

      const posterior = computeConfidence(evidence, { prior });

      // Posterior should be between prior and 1
      expect(posterior).toBeGreaterThan(prior);
      expect(posterior).toBeLessThanOrEqual(1);
    });

    it('should converge with more evidence', () => {
      const base = 0.7;

      const result1 = computeConfidence([{ type: 'e1', confidence: base, source: 'test' }]);

      const result2 = computeConfidence([
        { type: 'e1', confidence: base, source: 'test' },
        { type: 'e2', confidence: base, source: 'test' },
      ]);

      const result3 = computeConfidence([
        { type: 'e1', confidence: base, source: 'test' },
        { type: 'e2', confidence: base, source: 'test' },
        { type: 'e3', confidence: base, source: 'test' },
      ]);

      // More consistent evidence should increase confidence
      expect(result2).toBeGreaterThan(result1);
      expect(result3).toBeGreaterThan(result2);
    });
  });

  describe('edge cases', () => {
    it('should handle confidence of 1.0', () => {
      const evidence: Evidence[] = [{ type: 'definite', confidence: 1.0, source: 'test' }];

      const result = computeConfidence(evidence);
      expect(result).toBe(1.0);
    });

    it('should handle confidence of 0.0', () => {
      const evidence: Evidence[] = [{ type: 'impossible', confidence: 0.0, source: 'test' }];

      const result = computeConfidence(evidence);
      expect(result).toBe(0.0);
    });

    it('should clamp results to [0, 1]', () => {
      // Even with extreme inputs, should stay in valid range
      const evidence: Evidence[] = [
        { type: 'e1', confidence: 0.99, source: 'test' },
        { type: 'e2', confidence: 0.99, source: 'test' },
        { type: 'e3', confidence: 0.99, source: 'test' },
        { type: 'e4', confidence: 0.99, source: 'test' },
        { type: 'e5', confidence: 0.99, source: 'test' },
      ];

      const result = computeConfidence(evidence);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });
});
