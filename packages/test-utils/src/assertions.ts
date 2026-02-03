/**
 * Custom test assertions for PTL type inference
 */

import type { TypeInference, ConfidenceLevel } from '@ptl/core';

/**
 * Assert that a type inference has the expected type
 */
export function assertInferredType(
  inference: TypeInference,
  expectedType: string,
  message?: string
): void {
  if (inference.type !== expectedType) {
    throw new Error(message || `Expected type "${expectedType}" but got "${inference.type}"`);
  }
}

/**
 * Assert that a type inference has confidence above a threshold
 */
export function assertConfidenceAbove(
  inference: TypeInference,
  threshold: number,
  message?: string
): void {
  if (inference.confidence < threshold) {
    throw new Error(
      message || `Expected confidence >= ${threshold} but got ${inference.confidence}`
    );
  }
}

/**
 * Assert that a type inference has confidence below a threshold
 */
export function assertConfidenceBelow(
  inference: TypeInference,
  threshold: number,
  message?: string
): void {
  if (inference.confidence > threshold) {
    throw new Error(
      message || `Expected confidence <= ${threshold} but got ${inference.confidence}`
    );
  }
}

/**
 * Assert that a type inference has the expected confidence level
 */
export function assertConfidenceLevel(
  inference: TypeInference,
  expectedLevel: ConfidenceLevel,
  message?: string
): void {
  const level = getConfidenceLevel(inference.confidence);
  if (level !== expectedLevel) {
    throw new Error(message || `Expected confidence level "${expectedLevel}" but got "${level}"`);
  }
}

/**
 * Get confidence level from confidence value
 */
function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.85) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}

/**
 * Assert that inference includes specific evidence types
 */
export function assertHasEvidence(
  inference: TypeInference,
  evidenceTypes: string[],
  message?: string
): void {
  const foundTypes = new Set(inference.evidence?.map((e) => e.type) || []);

  for (const type of evidenceTypes) {
    if (!foundTypes.has(type)) {
      throw new Error(
        message || `Expected evidence type "${type}" but only found: ${[...foundTypes].join(', ')}`
      );
    }
  }
}

/**
 * Assert that inference is one of several possible types
 */
export function assertInferredTypeOneOf(
  inference: TypeInference,
  possibleTypes: string[],
  message?: string
): void {
  if (!possibleTypes.includes(inference.type)) {
    throw new Error(
      message ||
        `Expected type to be one of [${possibleTypes.join(', ')}] but got "${inference.type}"`
    );
  }
}

/**
 * Assert that a union type contains expected members
 */
export function assertUnionContains(
  inference: TypeInference,
  expectedMembers: string[],
  message?: string
): void {
  const unionMatch = inference.type.match(/^\((.+)\)$/);
  if (!unionMatch) {
    throw new Error(message || `Expected union type but got "${inference.type}"`);
  }

  const members = unionMatch[1].split(' | ').map((m) => m.trim());

  for (const expected of expectedMembers) {
    if (!members.includes(expected)) {
      throw new Error(
        message || `Expected union to contain "${expected}" but only found: ${members.join(', ')}`
      );
    }
  }
}
