/**
 * Core Adapter
 *
 * Bridges the @ptl/core engine to CLI types and provides convenience methods
 * for analysis, checking, and watching.
 */

import { readFile } from 'node:fs/promises';
import { createInferenceEngine } from '@ptl/core';
import type { InferenceEngine, InferenceEngineConfig } from '@ptl/core';
import type { FileResult, DiagnosticMessage } from '../types.js';

/**
 * Adapter for the PTL inference engine
 */
export class CoreAdapter {
  private readonly engine: InferenceEngine;

  constructor(config?: Partial<InferenceEngineConfig>) {
    this.engine = createInferenceEngine({
      includeStdlib: true,
      incremental: true,
      defaultAlpha: 1.0,
      smoothing: 0.1,
      minConfidence: 0.5,
      maxPropagationDepth: 10,
      ...config,
    });
  }

  /**
   * Analyze a single file
   */
  async analyzeFile(filePath: string): Promise<FileResult> {
    const startTime = Date.now();

    try {
      // Read file contents
      const source = await readFile(filePath, 'utf-8');

      // Analyze the file
      const analysisResult = this.engine.analyzeFile(filePath, source);

      // Convert core inference results to CLI format using pre-computed inference from SourceFileAnalyzer
      const inferences = analysisResult.symbols.map((symbol) => {
        const inference = symbol.inference;

        return {
          id: symbol.id,
          name: symbol.name,
          type: inference.mostLikely.typeId,
          confidence: inference.mostLikely.probability,
          alternatives: inference.beliefs.slice(1, 4).map((alt) => ({
            type: alt.typeId,
            probability: alt.probability,
          })),
          location: symbol.location,
        };
      });

      // Extract diagnostics
      const diagnostics: DiagnosticMessage[] = [];

      return {
        path: filePath,
        inferences,
        diagnostics,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const diagnostics: DiagnosticMessage[] = [
        {
          severity: 'error',
          message: `Failed to analyze file: ${error instanceof Error ? error.message : String(error)}`,
          location: { file: filePath, line: 0, column: 0 },
        },
      ];

      return {
        path: filePath,
        inferences: [],
        diagnostics,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Analyze multiple files
   */
  async analyzeFiles(filePaths: readonly string[]): Promise<FileResult[]> {
    const results: FileResult[] = [];

    for (const filePath of filePaths) {
      const result = await this.analyzeFile(filePath);
      results.push(result);
    }

    return results;
  }

  /**
   * Check types with stricter confidence thresholds
   */
  checkFile(result: FileResult, minConfidence: number): FileResult {
    // Filter inferences below minimum confidence and add warnings
    const diagnostics: DiagnosticMessage[] = [...result.diagnostics];

    for (const inference of result.inferences) {
      if (inference.confidence < minConfidence) {
        diagnostics.push({
          severity: 'warning',
          message: `Low confidence type inference: ${inference.name} has only ${(inference.confidence * 100).toFixed(1)}% confidence`,
          location: { file: result.path, line: inference.location?.startLine ?? 0, column: inference.location?.startColumn ?? 0 },
        });
      }
    }

    return {
      ...result,
      diagnostics,
    };
  }

  /**
   * Get or create engine instance (for testing/reuse)
   */
  getEngine() {
    return this.engine;
  }
}

/**
 * Create a new core adapter with optional configuration
 */
export function createCoreAdapter(config?: Partial<InferenceEngineConfig>): CoreAdapter {
  return new CoreAdapter(config);
}
