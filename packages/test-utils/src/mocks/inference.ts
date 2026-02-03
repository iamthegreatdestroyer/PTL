/**
 * Mock inference engine for testing
 */

import type { TypeInference, Evidence, ConfidenceLevel } from '@ptl/core';

/**
 * Mock inference result builder
 */
export class MockInferenceBuilder {
  private inference: Partial<TypeInference> = {};

  withName(name: string): this {
    this.inference.name = name;
    return this;
  }

  withType(type: string): this {
    this.inference.type = type;
    return this;
  }

  withConfidence(confidence: number): this {
    this.inference.confidence = confidence;
    return this;
  }

  withKind(kind: string): this {
    this.inference.kind = kind;
    return this;
  }

  withEvidence(evidence: Evidence[]): this {
    this.inference.evidence = evidence;
    return this;
  }

  withLocation(line: number, column: number): this {
    this.inference.location = { line, column };
    return this;
  }

  build(): TypeInference {
    return {
      name: this.inference.name ?? 'unknown',
      type: this.inference.type ?? 'any',
      confidence: this.inference.confidence ?? 0.5,
      kind: this.inference.kind ?? 'variable',
      evidence: this.inference.evidence ?? [],
      location: this.inference.location ?? { line: 1, column: 1 },
    } as TypeInference;
  }
}

/**
 * Create a mock inference
 */
export function mockInference(overrides: Partial<TypeInference> = {}): TypeInference {
  return {
    name: 'test',
    type: 'string',
    confidence: 0.85,
    kind: 'variable',
    evidence: [],
    location: { line: 1, column: 1 },
    ...overrides,
  } as TypeInference;
}

/**
 * Create mock evidence
 */
export function mockEvidence(type: string, confidence: number, description?: string): Evidence {
  return {
    type,
    confidence,
    description: description ?? `Evidence from ${type}`,
    source: 'mock',
  };
}

/**
 * Create a mock inference engine
 */
export function createMockInferenceEngine() {
  const inferences = new Map<string, TypeInference[]>();

  return {
    setInferences(fileName: string, results: TypeInference[]) {
      inferences.set(fileName, results);
    },

    async analyzeSource(code: string, options?: { fileName?: string }) {
      const fileName = options?.fileName ?? 'test.ts';
      return {
        inferences: inferences.get(fileName) ?? [],
        diagnostics: [],
        duration: 0,
      };
    },

    async analyzeFile(filePath: string) {
      return {
        inferences: inferences.get(filePath) ?? [],
        diagnostics: [],
        duration: 0,
      };
    },

    reset() {
      inferences.clear();
    },
  };
}

/**
 * Create inference for common patterns
 */
export const mockPatterns = {
  stringVariable(name: string, confidence = 0.95): TypeInference {
    return mockInference({
      name,
      type: 'string',
      kind: 'variable',
      confidence,
      evidence: [mockEvidence('literal_value', 0.99)],
    });
  },

  numberVariable(name: string, confidence = 0.95): TypeInference {
    return mockInference({
      name,
      type: 'number',
      kind: 'variable',
      confidence,
      evidence: [mockEvidence('literal_value', 0.99)],
    });
  },

  arrayVariable(name: string, elementType: string, confidence = 0.9): TypeInference {
    return mockInference({
      name,
      type: `${elementType}[]`,
      kind: 'variable',
      confidence,
      evidence: [mockEvidence('array_literal', 0.95)],
    });
  },

  functionParameter(name: string, type: string, confidence = 0.75): TypeInference {
    return mockInference({
      name,
      type,
      kind: 'parameter',
      confidence,
      evidence: [mockEvidence('usage_pattern', confidence)],
    });
  },

  functionReturn(name: string, returnType: string, confidence = 0.8): TypeInference {
    return mockInference({
      name,
      type: `(...) => ${returnType}`,
      kind: 'function',
      confidence,
      evidence: [mockEvidence('return_statement', confidence)],
    });
  },
};
