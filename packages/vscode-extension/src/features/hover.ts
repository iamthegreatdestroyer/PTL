/**
 * Hover Provider
 *
 * Provides hover information for PTL type inferences.
 */

import * as vscode from 'vscode';

import type { AnalysisManager, InferenceResult } from '../analysis';

/**
 * Provides hover information
 */
export class HoverProvider implements vscode.HoverProvider {
  private readonly analysisManager: AnalysisManager;

  constructor(analysisManager: AnalysisManager) {
    this.analysisManager = analysisManager;
  }

  /**
   * Provide hover for a position
   */
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const inference = this.analysisManager.getInferenceAt(document.uri, position);
    if (!inference) {
      return undefined;
    }

    const contents = this.createHoverContents(inference);
    return new vscode.Hover(contents, inference.range);
  }

  /**
   * Create hover contents for an inference
   */
  private createHoverContents(inference: InferenceResult): vscode.MarkdownString[] {
    const contents: vscode.MarkdownString[] = [];

    // Main type information
    const mainContent = new vscode.MarkdownString();
    mainContent.isTrusted = true;
    mainContent.supportHtml = true;

    mainContent.appendMarkdown('### PTL Type Inference\n\n');
    mainContent.appendCodeblock(inference.type, 'typescript');
    mainContent.appendMarkdown('\n');

    contents.push(mainContent);

    // Confidence information
    const confidenceContent = this.createConfidenceContent(inference);
    contents.push(confidenceContent);

    // Alternatives if available
    if (inference.alternatives && inference.alternatives.length > 0) {
      const alternativesContent = this.createAlternativesContent(inference);
      contents.push(alternativesContent);
    }

    return contents;
  }

  /**
   * Create confidence content
   */
  private createConfidenceContent(inference: InferenceResult): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.supportHtml = true;

    const confidencePercent = Math.round(inference.confidence * 100);
    const [low, high] = inference.confidenceInterval;

    // Confidence bar visualization
    const barLength = 20;
    const filledLength = Math.round((confidencePercent / 100) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

    md.appendMarkdown('#### Confidence\n\n');
    md.appendMarkdown(`\`${bar}\` **${confidencePercent}%**\n\n`);
    md.appendMarkdown(
      `*95% Confidence Interval:* ${Math.round(low * 100)}% – ${Math.round(high * 100)}%\n`
    );

    // Interpretation
    const interpretation = this.getConfidenceInterpretation(confidencePercent);
    md.appendMarkdown(`\n*${interpretation}*\n`);

    return md;
  }

  /**
   * Create alternatives content
   */
  private createAlternativesContent(inference: InferenceResult): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;

    md.appendMarkdown('#### Alternative Types\n\n');

    const alternatives = inference.alternatives!.slice(0, 5);
    for (const alt of alternatives) {
      const percent = Math.round(alt.confidence * 100);
      const barLength = 10;
      const filled = Math.round((percent / 100) * barLength);
      const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

      md.appendMarkdown(`- \`${alt.type}\` \`${bar}\` ${percent}%\n`);
    }

    return md;
  }

  /**
   * Get human-readable confidence interpretation
   */
  private getConfidenceInterpretation(confidence: number): string {
    if (confidence >= 95) {
      return 'Very high confidence - type is almost certainly correct';
    } else if (confidence >= 85) {
      return 'High confidence - type is likely correct';
    } else if (confidence >= 70) {
      return 'Moderate confidence - consider adding type annotation';
    } else if (confidence >= 50) {
      return 'Low confidence - type annotation recommended';
    } else {
      return 'Very low confidence - explicit type annotation strongly recommended';
    }
  }
}
