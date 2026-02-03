/**
 * Analyzer Module
 *
 * Provides the main analysis entry point that orchestrates
 * lattice construction, observation collection, and inference.
 *
 * @packageDocumentation
 */

export { Analyzer, createAnalyzer } from './analyzer.js';
export { SourceFileAnalyzer } from './source-file-analyzer.js';
export type {
  AnalyzerConfig,
  AnalysisResult,
  SymbolInfo,
  FileAnalysisResult,
  AnalysisContext,
  AnalysisOptions,
  SymbolInference,
} from './types.js';
