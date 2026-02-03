/**
 * Expected inference results for fixtures
 */

import type { TypeInference } from '@ptl/core';

/**
 * Expected results for variable samples
 */
export const EXPECTED_VARIABLE_RESULTS: Record<string, Partial<TypeInference>[]> = {
  primitives: [
    { name: 'name', type: 'string', kind: 'variable' },
    { name: 'age', type: 'number', kind: 'variable' },
    { name: 'active', type: 'boolean', kind: 'variable' },
    { name: 'nothing', type: 'null', kind: 'variable' },
  ],
  arrays: [
    { name: 'numbers', type: 'number[]', kind: 'variable' },
    { name: 'strings', type: 'string[]', kind: 'variable' },
    { name: 'mixed', type: '(number | string | boolean)[]', kind: 'variable' },
  ],
};

/**
 * Expected results for function samples
 */
export const EXPECTED_FUNCTION_RESULTS: Record<string, Partial<TypeInference>[]> = {
  simpleArithmetic: [
    { name: 'add', kind: 'function' },
    { name: 'a', type: 'number', kind: 'parameter' },
    { name: 'b', type: 'number', kind: 'parameter' },
  ],
  stringOperations: [
    { name: 'greet', kind: 'function' },
    { name: 'name', type: 'string', kind: 'parameter' },
  ],
};

/**
 * Confidence thresholds for different code patterns
 */
export const CONFIDENCE_EXPECTATIONS = {
  // Literals have very high confidence
  literalPrimitives: 0.98,
  literalArrays: 0.95,
  literalObjects: 0.9,

  // Function inference confidence varies
  arithmeticOperations: 0.85,
  stringOperations: 0.8,
  higherOrderFunctions: 0.7,

  // Ambiguous patterns have lower confidence
  plusOperator: 0.5, // Could be string or number
  multipleReturns: 0.6,
  generic: 0.4,
};

/**
 * Expected evidence types for different patterns
 */
export const EXPECTED_EVIDENCE = {
  literals: ['literal_value'],
  arithmetic: ['binary_operator', 'arithmetic_operation'],
  stringOps: ['string_concatenation', 'template_literal'],
  propertyAccess: ['property_access', 'object_shape'],
  functionCall: ['function_call', 'return_type'],
  naming: ['naming_convention', 'semantic_hint'],
};
