/**
 * Analyzer
 *
 * Main entry point for analyzing TypeScript/JavaScript projects.
 * Orchestrates the analysis pipeline from source files to inference results.
 */

import { TypeLattice } from '../lattice/type-lattice.js';
import { BayesianInferenceEngine, createBayesianEngine } from '../bayesian/bayesian-inference.js';
import {
  IncrementalUpdater,
  createIncrementalUpdater,
} from '../incremental/incremental-updater.js';
import { DependencyGraph } from '../incremental/dependency-graph.js';
import { SourceFileAnalyzer } from './source-file-analyzer.js';
import type {
  AnalyzerConfig,
  AnalysisResult,
  FileAnalysisResult,
  AnalysisError,
  AnalysisWarning,
  AnalysisStats,
} from './types.js';

/**
 * Default analyzer configuration
 */
const DEFAULT_CONFIG: AnalyzerConfig = {
  rootDir: '.',
  include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
  exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
  strict: true,
  includeNodeModules: false,
  minConfidence: 0.5,
  maxAlternatives: 3,
  useEmpiricalPriors: true,
  incremental: true,
};

/**
 * Analyzer
 *
 * The main analyzer class that coordinates all analysis components.
 */
export class Analyzer {
  private readonly config: AnalyzerConfig;
  private readonly lattice: TypeLattice;
  private readonly engine: BayesianInferenceEngine;
  private readonly incremental: IncrementalUpdater;
  private readonly fileAnalyzer: SourceFileAnalyzer;
  private readonly analyzedFiles: Map<string, FileAnalysisResult> = new Map();

  constructor(config?: Partial<AnalyzerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize type lattice with standard library types
    this.lattice = new TypeLattice({
      includeStdlib: true,
    });

    // Initialize inference engine
    this.engine = createBayesianEngine(
      {
        defaultAlpha: 1.0,
        typePriors: new Map(),
        smoothing: 0.1,
      },
      this.lattice
    );

    // Initialize incremental updater
    const graph = new DependencyGraph();
    this.incremental = createIncrementalUpdater(this.engine, graph, {
      maxDepth: 10,
      eagerReInference: false,
      minConfidenceChange: 0.05,
    });

    // Initialize file analyzer
    this.fileAnalyzer = new SourceFileAnalyzer(this.lattice, this.engine, {
      minConfidence: this.config.minConfidence,
      maxAlternatives: this.config.maxAlternatives,
    });
  }

  /**
   * Analyze a single file
   */
  analyzeFile(file: string, source: string): FileAnalysisResult {
    const result = this.fileAnalyzer.analyze(file, source);
    this.analyzedFiles.set(file, result);
    return result;
  }

  /**
   * Analyze multiple files
   */
  analyzeFiles(files: Array<{ file: string; source: string }>): FileAnalysisResult[] {
    return files.map(({ file, source }) => this.analyzeFile(file, source));
  }

  /**
   * Analyze a project directory
   *
   * Discovers and analyzes all TypeScript/JavaScript files matching the configured patterns.
   */
  async analyzeProject(rootDir?: string): Promise<AnalysisResult> {
    const startTime = Date.now();
    const root = rootDir ?? this.config.rootDir;

    // Step 1: Discover files
    const filePaths = await this.discoverFiles(root);

    // Step 2: Read and analyze files
    const files: FileAnalysisResult[] = [];
    const errors: AnalysisError[] = [];
    const warnings: AnalysisWarning[] = [];

    let parseTimeMs = 0;
    let analyzeTimeMs = 0;
    let inferenceTimeMs = 0;

    for (const filePath of filePaths) {
      try {
        const fileStartTime = Date.now();

        // Read file
        const source = await this.readFile(filePath);
        const readTime = Date.now() - fileStartTime;

        // Analyze file
        const analyzeStartTime = Date.now();
        const result = this.analyzeFile(filePath, source);
        const analyzeTime = Date.now() - analyzeStartTime;

        files.push(result);
        errors.push(...result.errors);

        // Track timing
        parseTimeMs += readTime;
        analyzeTimeMs += analyzeTime - result.durationMs;
        inferenceTimeMs += result.durationMs;
      } catch (error) {
        errors.push({
          code: 'FILE_READ_ERROR',
          message: `Failed to read ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error',
          file: filePath,
        });
      }
    }

    const durationMs = Date.now() - startTime;

    // Step 3: Compute statistics
    return this.computeAnalysisResult(
      root,
      files,
      errors,
      warnings,
      durationMs,
      parseTimeMs,
      analyzeTimeMs,
      inferenceTimeMs
    );
  }

  /**
   * Discover files matching include/exclude patterns
   */
  private async discoverFiles(rootDir: string): Promise<string[]> {
    const { include, exclude } = this.config;

    // Import glob dynamically (ESM compatible)
    const { glob } = await import('glob');

    const allFiles: Set<string> = new Set();

    // Process include patterns
    for (const pattern of include) {
      const matches = await glob(pattern, {
        cwd: rootDir,
        absolute: true,
        ignore: exclude as string[],
        nodir: true,
        follow: false, // Don't follow symlinks
      });

      for (const file of matches) {
        allFiles.add(file);
      }
    }

    return Array.from(allFiles).sort();
  }

  /**
   * Read a file with error handling
   */
  private async readFile(filePath: string): Promise<string> {
    const fs = await import('node:fs/promises');
    return fs.readFile(filePath, 'utf-8');
  }

  /**
   * Compute final analysis result with statistics
   */
  private computeAnalysisResult(
    rootDir: string,
    files: FileAnalysisResult[],
    errors: AnalysisError[],
    warnings: AnalysisWarning[],
    durationMs: number,
    parseTimeMs: number,
    analyzeTimeMs: number,
    inferenceTimeMs: number
  ): AnalysisResult {
    const totalSymbols = files.reduce((sum, f) => sum + f.symbolCount, 0);
    const allSymbols = files.flatMap((f) => f.symbols);

    const highConfidenceSymbols = allSymbols.filter((s) => s.confidence >= 0.8).length;
    const mediumConfidenceSymbols = allSymbols.filter(
      (s) => s.confidence >= 0.5 && s.confidence < 0.8
    ).length;
    const lowConfidenceSymbols = allSymbols.filter((s) => s.confidence < 0.5).length;

    const averageConfidence =
      allSymbols.length > 0
        ? allSymbols.reduce((sum, s) => sum + s.confidence, 0) / allSymbols.length
        : 0;

    const stats: AnalysisStats = {
      filesProcessed: files.length,
      symbolsAnalyzed: totalSymbols,
      observationsCollected: 0, // Would be tracked during analysis
      typesInLattice: this.lattice.getAllTypes().length,
      cacheHits: 0,
      cacheMisses: 0,
      parseTimeMs,
      analyzeTimeMs,
      inferenceTimeMs,
    };

    return {
      rootDir,
      files,
      totalSymbols,
      highConfidenceSymbols,
      mediumConfidenceSymbols,
      lowConfidenceSymbols,
      averageConfidence,
      durationMs,
      errors,
      warnings,
      stats,
    };
  }

  /**
   * Update analysis after a file change
   */
  updateFile(file: string, source: string): FileAnalysisResult {
    // Handle file change in incremental updater
    this.incremental.handleFileChange(file);

    // Re-analyze the file
    return this.analyzeFile(file, source);
  }

  /**
   * Remove a file from analysis
   */
  removeFile(file: string): void {
    this.analyzedFiles.delete(file);
    this.incremental.handleFileDelete(file);
  }

  /**
   * Get the type lattice
   */
  getLattice(): TypeLattice {
    return this.lattice;
  }

  /**
   * Get the inference engine
   */
  getEngine(): BayesianInferenceEngine {
    return this.engine;
  }

  /**
   * Get the incremental updater
   */
  getIncremental(): IncrementalUpdater {
    return this.incremental;
  }

  /**
   * Get the dependency graph
   */
  getGraph(): DependencyGraph {
    return this.incremental.getGraph();
  }

  /**
   * Get configuration
   */
  getConfig(): AnalyzerConfig {
    return this.config;
  }

  /**
   * Get analysis result for a specific file
   */
  getFileResult(file: string): FileAnalysisResult | undefined {
    return this.analyzedFiles.get(file);
  }

  /**
   * Get all analyzed files
   */
  getAnalyzedFiles(): string[] {
    return [...this.analyzedFiles.keys()];
  }

  /**
   * Clear all analysis results
   */
  clear(): void {
    this.analyzedFiles.clear();
    this.incremental.getGraph().clear();
  }

  /**
   * Export state for serialization
   */
  toJSON(): object {
    return {
      config: this.config,
      lattice: this.lattice.toJSON(),
      engine: this.engine.toJSON(),
      incremental: this.incremental.toJSON(),
      files: [...this.analyzedFiles.keys()],
    };
  }
}

/**
 * Factory function to create an Analyzer
 */
export function createAnalyzer(config?: Partial<AnalyzerConfig>): Analyzer {
  return new Analyzer(config);
}
