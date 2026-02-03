/**
 * Inline Hints Provider
 *
 * Provides inlay hints showing confidence levels inline.
 */

import * as vscode from 'vscode';

import type { AnalysisManager, InferenceResult } from '../analysis';

/**
 * Provides inline confidence hints
 */
export class InlineHintsProvider implements vscode.InlayHintsProvider {
  private readonly analysisManager: AnalysisManager;

  constructor(analysisManager: AnalysisManager) {
    this.analysisManager = analysisManager;
  }

  /**
   * Provide inlay hints for a document
   */
  provideInlayHints(
    document: vscode.TextDocument,
    range: vscode.Range,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.InlayHint[]> {
    const analysis = this.analysisManager.getCachedAnalysis(document.uri);
    if (!analysis) {
      return [];
    }

    const hints: vscode.InlayHint[] = [];

    for (const inference of analysis.inferences) {
      // Only show hints for inferences within the requested range
      if (!range.contains(inference.range) && !inference.range.intersection(range)) {
        continue;
      }

      const hint = this.createInlayHint(inference);
      if (hint) {
        hints.push(hint);
      }
    }

    return hints;
  }

  /**
   * Create an inlay hint for an inference
   */
  private createInlayHint(inference: InferenceResult): vscode.InlayHint | undefined {
    // Only show hints for inferred types
    if (!inference.isInferred) {
      return undefined;
    }

    const confidencePercent = Math.round(inference.confidence * 100);
    const position = inference.range.end;

    // Create the label with confidence indicator
    const label = this.formatConfidenceLabel(inference.type, confidencePercent);

    const hint = new vscode.InlayHint(position, label, vscode.InlayHintKind.Type);

    // Add tooltip with detailed information
    hint.tooltip = this.createTooltip(inference);

    // Make it slightly transparent
    hint.paddingLeft = true;
    hint.paddingRight = true;

    return hint;
  }

  /**
   * Format the confidence label
   */
  private formatConfidenceLabel(
    type: string,
    confidencePercent: number
  ): vscode.InlayHintLabelPart[] {
    const parts: vscode.InlayHintLabelPart[] = [];

    // Type part
    const typePart = new vscode.InlayHintLabelPart(`: ${type}`);
    parts.push(typePart);

    // Confidence indicator
    const confidenceIcon = this.getConfidenceIcon(confidencePercent);
    const confidencePart = new vscode.InlayHintLabelPart(` ${confidenceIcon}${confidencePercent}%`);
    parts.push(confidencePart);

    return parts;
  }

  /**
   * Get confidence icon based on level
   */
  private getConfidenceIcon(confidence: number): string {
    if (confidence >= 90) {
      return '✓';
    } else if (confidence >= 70) {
      return '~';
    } else if (confidence >= 50) {
      return '?';
    } else {
      return '⚠';
    }
  }

  /**
   * Create tooltip content
   */
  private createTooltip(inference: InferenceResult): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;

    const confidencePercent = Math.round(inference.confidence * 100);
    const [low, high] = inference.confidenceInterval;

    md.appendMarkdown(`**Inferred Type:** \`${inference.type}\`\n\n`);
    md.appendMarkdown(`**Confidence:** ${confidencePercent}%\n\n`);
    md.appendMarkdown(`**95% CI:** [${Math.round(low * 100)}%, ${Math.round(high * 100)}%]\n\n`);

    if (inference.alternatives && inference.alternatives.length > 0) {
      md.appendMarkdown('**Alternatives:**\n');
      for (const alt of inference.alternatives.slice(0, 5)) {
        const altPercent = Math.round(alt.confidence * 100);
        md.appendMarkdown(`- \`${alt.type}\` (${altPercent}%)\n`);
      }
    }

    return md;
  }
}
