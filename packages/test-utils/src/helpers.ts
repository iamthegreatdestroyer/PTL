/**
 * Test helper utilities for PTL
 */

import { createInferenceEngine } from '@ptl/core';
import type { TypeInference } from './assertions.js';

/**
 * Create an inference engine instance for testing
 */
export function createTestEngine() {
  return createInferenceEngine({
    includeStdlib: true,
    incremental: false,
    minConfidence: 0.1,
  });
}

/**
 * Analyze code and return inferences (mock — uses engine symbol observation)
 */
export async function analyzeCode(
  code: string,
  options?: {
    fileName?: string;
  }
): Promise<TypeInference[]> {
  const engine = createTestEngine();
  const fileName = options?.fileName ?? 'test.ts';
  const result = engine.analyzeFile(fileName, code);

  return result.symbols.map((s) => {
    const inf = engine.infer(s.id);
    return {
      type: inf.mostLikely.typeId,
      confidence: inf.mostLikely.probability,
    };
  });
}

/**
 * Find inference by type string
 */
export function findInference(
  inferences: TypeInference[],
  type: string
): TypeInference | undefined {
  return inferences.find((i) => i.type === type);
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
 * Wait for async operations to complete
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
