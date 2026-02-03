/**
 * Analysis Manager
 *
 * Manages document analysis and caches results.
 */

import * as vscode from 'vscode';

import type { ConfigurationManager } from './configuration';

/**
 * Inference result for a single location
 */
export interface InferenceResult {
  readonly type: string;
  readonly confidence: number;
  readonly confidenceInterval: [number, number];
  readonly range: vscode.Range;
  readonly isInferred: boolean;
  readonly alternatives?: readonly AlternativeType[];
}

/**
 * Alternative type suggestion
 */
export interface AlternativeType {
  readonly type: string;
  readonly confidence: number;
}

/**
 * Document analysis result
 */
export interface DocumentAnalysis {
  readonly uri: vscode.Uri;
  readonly version: number;
  readonly timestamp: number;
  readonly inferences: readonly InferenceResult[];
  readonly errors: readonly AnalysisError[];
}

/**
 * Analysis error
 */
export interface AnalysisError {
  readonly message: string;
  readonly range: vscode.Range;
  readonly severity: 'error' | 'warning';
}

/**
 * Manages document analysis
 */
export class AnalysisManager implements vscode.Disposable {
  private readonly configManager: ConfigurationManager;
  private readonly outputChannel: vscode.OutputChannel;
  private readonly cache = new Map<string, DocumentAnalysis>();
  private readonly pendingAnalysis = new Map<string, NodeJS.Timeout>();

  private readonly debounceDelay = 500; // ms

  constructor(configManager: ConfigurationManager, outputChannel: vscode.OutputChannel) {
    this.configManager = configManager;
    this.outputChannel = outputChannel;
  }

  /**
   * Analyze a document
   */
  async analyzeDocument(document: vscode.TextDocument): Promise<DocumentAnalysis> {
    const uri = document.uri.toString();

    this.log(`Analyzing document: ${document.fileName}`);

    try {
      // TODO: Implement actual analysis using @ptl/core
      // For now, return empty analysis
      const analysis: DocumentAnalysis = {
        uri: document.uri,
        version: document.version,
        timestamp: Date.now(),
        inferences: [],
        errors: [],
      };

      // Cache the result
      this.cache.set(uri, analysis);

      this.log(`Analysis complete: ${analysis.inferences.length} inferences`);

      return analysis;
    } catch (error) {
      this.log(`Analysis error: ${error}`);
      throw error;
    }
  }

  /**
   * Schedule analysis with debouncing
   */
  scheduleAnalysis(document: vscode.TextDocument): void {
    const uri = document.uri.toString();

    // Cancel existing pending analysis
    const existing = this.pendingAnalysis.get(uri);
    if (existing) {
      clearTimeout(existing);
    }

    // Schedule new analysis
    const timeout = setTimeout(() => {
      this.pendingAnalysis.delete(uri);
      void this.analyzeDocument(document);
    }, this.debounceDelay);

    this.pendingAnalysis.set(uri, timeout);
  }

  /**
   * Get cached analysis for a document
   */
  getCachedAnalysis(uri: vscode.Uri): DocumentAnalysis | undefined {
    return this.cache.get(uri.toString());
  }

  /**
   * Get inference at a specific position
   */
  getInferenceAt(uri: vscode.Uri, position: vscode.Position): InferenceResult | undefined {
    const analysis = this.cache.get(uri.toString());
    if (!analysis) {
      return undefined;
    }

    return analysis.inferences.find((inf) => inf.range.contains(position));
  }

  /**
   * Get all inferences in a range
   */
  getInferencesInRange(uri: vscode.Uri, range: vscode.Range): readonly InferenceResult[] {
    const analysis = this.cache.get(uri.toString());
    if (!analysis) {
      return [];
    }

    return analysis.inferences.filter(
      (inf) => range.contains(inf.range) || inf.range.intersection(range)
    );
  }

  /**
   * Clear cache for a document
   */
  clearCache(uri: vscode.Uri): void {
    this.cache.delete(uri.toString());
  }

  /**
   * Clear all cached analyses
   */
  clearAllCaches(): void {
    this.cache.clear();
  }

  /**
   * Log a message
   */
  private log(message: string): void {
    this.outputChannel.appendLine(`[Analysis] ${message}`);
  }

  dispose(): void {
    // Cancel all pending analyses
    for (const timeout of this.pendingAnalysis.values()) {
      clearTimeout(timeout);
    }
    this.pendingAnalysis.clear();
    this.cache.clear();
  }
}
