/**
 * Code Lens Provider
 *
 * Provides code lenses for PTL analysis summaries.
 */

import * as vscode from 'vscode';

import type { AnalysisManager } from '../analysis';
import type { ConfigurationManager } from '../configuration';

/**
 * Provides code lenses for PTL
 */
export class CodeLensProvider implements vscode.CodeLensProvider {
  private readonly analysisManager: AnalysisManager;
  private readonly configManager: ConfigurationManager;
  private readonly onDidChangeEmitter = new vscode.EventEmitter<void>();

  readonly onDidChangeCodeLenses = this.onDidChangeEmitter.event;

  constructor(analysisManager: AnalysisManager, configManager: ConfigurationManager) {
    this.analysisManager = analysisManager;
    this.configManager = configManager;
  }

  /**
   * Provide code lenses for a document
   */
  provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    const analysis = this.analysisManager.getCachedAnalysis(document.uri);
    if (!analysis || analysis.inferences.length === 0) {
      return [];
    }

    const lenses: vscode.CodeLens[] = [];

    // Summary lens at the top of the file
    const summaryLens = this.createSummaryLens(document, analysis.inferences.length);
    lenses.push(summaryLens);

    // Function-level lenses
    const functionLenses = this.createFunctionLenses(document, analysis.inferences);
    lenses.push(...functionLenses);

    return lenses;
  }

  /**
   * Resolve a code lens
   */
  resolveCodeLens(
    codeLens: vscode.CodeLens,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens> {
    return codeLens;
  }

  /**
   * Create summary code lens
   */
  private createSummaryLens(
    document: vscode.TextDocument,
    inferenceCount: number
  ): vscode.CodeLens {
    const range = new vscode.Range(0, 0, 0, 0);

    const analysis = this.analysisManager.getCachedAnalysis(document.uri);
    const threshold = this.configManager.getLowConfidenceThreshold();

    const lowConfidenceCount =
      analysis?.inferences.filter((i) => i.confidence < threshold).length || 0;

    const averageConfidence = analysis
      ? analysis.inferences.reduce((sum, i) => sum + i.confidence, 0) / analysis.inferences.length
      : 0;

    const avgPercent = Math.round(averageConfidence * 100);

    let title = `PTL: ${inferenceCount} types inferred`;
    if (lowConfidenceCount > 0) {
      title += ` (${lowConfidenceCount} low confidence)`;
    }
    title += ` | Avg: ${avgPercent}%`;

    const command: vscode.Command = {
      title,
      command: 'ptl.analyze',
      tooltip: 'Click to re-analyze',
    };

    return new vscode.CodeLens(range, command);
  }

  /**
   * Create function-level code lenses
   */
  private createFunctionLenses(
    document: vscode.TextDocument,
    inferences: readonly import('../analysis').InferenceResult[]
  ): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];
    const text = document.getText();

    // Simple regex to find function declarations
    const functionPattern =
      /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=])+=>|(\w+)\s*\([^)]*\)\s*{)/g;

    let match: RegExpExecArray | null;
    while ((match = functionPattern.exec(text)) !== null) {
      const functionName = match[1] || match[2] || match[3];
      if (!functionName) continue;

      const position = document.positionAt(match.index);
      const line = position.line;
      const range = new vscode.Range(line, 0, line, 0);

      // Find inferences within this function (simplified - just check if on same line or nearby)
      const functionInferences = inferences.filter((inf) => {
        const lineDistance = Math.abs(inf.range.start.line - line);
        return lineDistance < 20; // Rough heuristic
      });

      if (functionInferences.length > 0) {
        const avgConfidence =
          functionInferences.reduce((sum, i) => sum + i.confidence, 0) / functionInferences.length;
        const avgPercent = Math.round(avgConfidence * 100);

        const command: vscode.Command = {
          title: `${functionInferences.length} inferences (avg ${avgPercent}%)`,
          command: 'ptl.showTypeInfo',
          tooltip: `${functionName}: ${functionInferences.length} type inferences`,
        };

        lenses.push(new vscode.CodeLens(range, command));
      }
    }

    return lenses;
  }

  /**
   * Trigger refresh of code lenses
   */
  refresh(): void {
    this.onDidChangeEmitter.fire();
  }

  dispose(): void {
    this.onDidChangeEmitter.dispose();
  }
}
