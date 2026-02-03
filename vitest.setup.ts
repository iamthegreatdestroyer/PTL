/**
 * Vitest global setup
 */

import { expect } from 'vitest';
import { setupPtlMatchers } from '@ptl/test-utils';

// Extend Vitest with custom PTL matchers
setupPtlMatchers(expect);

// Global test utilities
declare global {
  namespace Vi {
    interface JestAssertion<T = any> {
      toHaveType(expectedType: string): T;
      toHaveConfidence(threshold: number): T;
      toHaveConfidenceLevel(level: 'high' | 'medium' | 'low'): T;
      toHaveEvidence(evidenceType: string): T;
      toBeUnionOf(types: string[]): T;
    }
  }
}
