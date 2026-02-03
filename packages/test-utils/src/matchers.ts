/**
 * Custom Vitest matchers for PTL type inference
 */

import type { TypeInference } from '@ptl/core';

/**
 * Vitest matcher extensions
 */
export interface PtlMatchers {
  toHaveType(expectedType: string): void;
  toHaveConfidence(threshold: number): void;
  toHaveConfidenceLevel(level: 'high' | 'medium' | 'low'): void;
  toHaveEvidence(evidenceType: string): void;
  toBeUnionOf(types: string[]): void;
}

/**
 * Create Vitest matchers for PTL
 */
export function createPtlMatchers() {
  return {
    toHaveType(received: TypeInference, expectedType: string) {
      const pass = received.type === expectedType;
      return {
        pass,
        message: () =>
          pass
            ? `Expected type not to be "${expectedType}"`
            : `Expected type "${expectedType}" but got "${received.type}"`,
      };
    },

    toHaveConfidence(received: TypeInference, threshold: number) {
      const pass = received.confidence >= threshold;
      return {
        pass,
        message: () =>
          pass
            ? `Expected confidence below ${threshold}`
            : `Expected confidence >= ${threshold} but got ${received.confidence.toFixed(2)}`,
      };
    },

    toHaveConfidenceLevel(received: TypeInference, level: 'high' | 'medium' | 'low') {
      const actualLevel = getConfidenceLevel(received.confidence);
      const pass = actualLevel === level;
      return {
        pass,
        message: () =>
          pass
            ? `Expected confidence level not to be "${level}"`
            : `Expected confidence level "${level}" but got "${actualLevel}"`,
      };
    },

    toHaveEvidence(received: TypeInference, evidenceType: string) {
      const foundTypes = received.evidence?.map((e) => e.type) || [];
      const pass = foundTypes.includes(evidenceType);
      return {
        pass,
        message: () =>
          pass
            ? `Expected not to have evidence type "${evidenceType}"`
            : `Expected evidence type "${evidenceType}" but only found: ${foundTypes.join(', ')}`,
      };
    },

    toBeUnionOf(received: TypeInference, types: string[]) {
      const unionMatch = received.type.match(/^\((.+)\)$/);
      if (!unionMatch) {
        return {
          pass: false,
          message: () => `Expected union type but got "${received.type}"`,
        };
      }

      const members = new Set(unionMatch[1].split(' | ').map((m) => m.trim()));
      const expectedSet = new Set(types);

      const pass = members.size === expectedSet.size && types.every((t) => members.has(t));

      return {
        pass,
        message: () =>
          pass
            ? `Expected not to be union of [${types.join(', ')}]`
            : `Expected union of [${types.join(', ')}] but got [${[...members].join(', ')}]`,
      };
    },
  };
}

function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.85) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}

/**
 * Setup Vitest with PTL matchers
 */
export function setupPtlMatchers(expect: any) {
  const matchers = createPtlMatchers();
  expect.extend(matchers);
}
