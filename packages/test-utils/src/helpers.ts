/**
 * Test helper utilities for PTL
 */

import { BayesianTypeInference, type TypeInference } from '@ptl/core';

/**
 * Create a BayesianTypeInference instance for testing
 */
export function createTestInference(): BayesianTypeInference {
  return new BayesianTypeInference({
    strict: false,
    minConfidence: 0.1,
    debug: true,
  });
}

/**
 * Analyze code and return inferences
 */
export async function analyzeCode(
  code: string,
  options?: {
    fileName?: string;
    strict?: boolean;
  }
): Promise<TypeInference[]> {
  const inference = new BayesianTypeInference({
    strict: options?.strict ?? false,
    debug: true,
  });

  const result = await inference.analyzeSource(code, {
    fileName: options?.fileName ?? 'test.ts',
  });

  return result.inferences;
}

/**
 * Find inference by name
 */
export function findInference(
  inferences: TypeInference[],
  name: string
): TypeInference | undefined {
  return inferences.find((i) => i.name === name);
}

/**
 * Get inferences by kind (variable, parameter, function, etc.)
 */
export function filterByKind(inferences: TypeInference[], kind: string): TypeInference[] {
  return inferences.filter((i) => i.kind === kind);
}

/**
 * Get high-confidence inferences
 */
export function getHighConfidence(inferences: TypeInference[], threshold = 0.85): TypeInference[] {
  return inferences.filter((i) => i.confidence >= threshold);
}

/**
 * Get low-confidence inferences
 */
export function getLowConfidence(inferences: TypeInference[], threshold = 0.6): TypeInference[] {
  return inferences.filter((i) => i.confidence < threshold);
}

/**
 * Create inline source code for testing
 */
export function createTestSource(lines: string[]): string {
  return lines.join('\n');
}

/**
 * Wait for async analysis to complete
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock file system for testing
 */
export function createMockFileSystem(files: Record<string, string>): {
  readFile: (path: string) => string;
  writeFile: (path: string, content: string) => void;
  exists: (path: string) => boolean;
  listFiles: () => string[];
} {
  const fs = new Map(Object.entries(files));

  return {
    readFile: (path: string) => {
      const content = fs.get(path);
      if (content === undefined) {
        throw new Error(`File not found: ${path}`);
      }
      return content;
    },
    writeFile: (path: string, content: string) => {
      fs.set(path, content);
    },
    exists: (path: string) => fs.has(path),
    listFiles: () => [...fs.keys()],
  };
}

/**
 * Normalize type string for comparison
 */
export function normalizeType(type: string): string {
  return type
    .replace(/\s+/g, ' ')
    .replace(/\s*\|\s*/g, ' | ')
    .replace(/\s*&\s*/g, ' & ')
    .replace(/\s*,\s*/g, ', ')
    .trim();
}

/**
 * Compare types accounting for equivalent representations
 */
export function typesEqual(a: string, b: string): boolean {
  return normalizeType(a) === normalizeType(b);
}
