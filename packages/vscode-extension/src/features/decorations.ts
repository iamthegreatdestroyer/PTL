/**
 * Decorations Manager
 *
 * Manages text decorations for highlighting types.
 */

import * as vscode from 'vscode';

import type { AnalysisManager, InferenceResult } from '../analysis';
import type { ConfigurationManager } from '../configuration';

/**
 * Manages text decorations
 */
export class DecorationsManager implements vscode.Disposable {
  private readonly analysisManager: AnalysisManager;
  private readonly configManager: ConfigurationManager;

  // Decoration types for different confidence levels
  private readonly highConfidenceDecoration: vscode.TextEditorDecorationType;
  private readonly mediumConfidenceDecoration: vscode.TextEditorDecorationType;
  private readonly lowConfidenceDecoration: vscode.TextEditorDecorationType;

  private readonly disposables: vscode.Disposable[] = [];

  constructor(analysisManager: AnalysisManager, configManager: ConfigurationManager) {
    this.analysisManager = analysisManager;
    this.configManager = configManager;

    // Create decoration types
    this.highConfidenceDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('ptl.highConfidence'),
      borderRadius: '2px',
    });

    this.mediumConfidenceDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('ptl.mediumConfidence'),
      borderRadius: '2px',
    });

    this.lowConfidenceDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('ptl.lowConfidence'),
      borderRadius: '2px',
      textDecoration: 'underline wavy',
    });

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    // Update decorations when editor changes
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          this.updateDecorations(editor);
        }
      })
    );

    // Update decorations when text changes
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
          this.updateDecorations(editor);
        }
      })
    );

    // Initial decoration update
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      this.updateDecorations(editor);
    }
  }

  /**
   * Update decorations for an editor
   */
  updateDecorations(editor: vscode.TextEditor): void {
    if (!this.configManager.highlightLowConfidence()) {
      this.clearDecorations(editor);
      return;
    }

    const analysis = this.analysisManager.getCachedAnalysis(editor.document.uri);
    if (!analysis) {
      this.clearDecorations(editor);
      return;
    }

    const highDecorations: vscode.DecorationOptions[] = [];
    const mediumDecorations: vscode.DecorationOptions[] = [];
    const lowDecorations: vscode.DecorationOptions[] = [];

    for (const inference of analysis.inferences) {
      const decoration = this.createDecoration(inference);
      const confidence = inference.confidence;

      if (confidence >= 0.85) {
        highDecorations.push(decoration);
      } else if (confidence >= 0.6) {
        mediumDecorations.push(decoration);
      } else {
        lowDecorations.push(decoration);
      }
    }

    editor.setDecorations(this.highConfidenceDecoration, highDecorations);
    editor.setDecorations(this.mediumConfidenceDecoration, mediumDecorations);
    editor.setDecorations(this.lowConfidenceDecoration, lowDecorations);
  }

  /**
   * Clear decorations from an editor
   */
  clearDecorations(editor: vscode.TextEditor): void {
    editor.setDecorations(this.highConfidenceDecoration, []);
    editor.setDecorations(this.mediumConfidenceDecoration, []);
    editor.setDecorations(this.lowConfidenceDecoration, []);
  }

  /**
   * Create a decoration for an inference
   */
  private createDecoration(inference: InferenceResult): vscode.DecorationOptions {
    const confidencePercent = Math.round(inference.confidence * 100);
    const [low, high] = inference.confidenceInterval;

    const hoverMessage = new vscode.MarkdownString();
    hoverMessage.appendMarkdown(`**Type:** \`${inference.type}\`\n\n`);
    hoverMessage.appendMarkdown(`**Confidence:** ${confidencePercent}%\n\n`);
    hoverMessage.appendMarkdown(`**CI:** [${Math.round(low * 100)}%, ${Math.round(high * 100)}%]`);

    return {
      range: inference.range,
      hoverMessage,
    };
  }

  dispose(): void {
    this.highConfidenceDecoration.dispose();
    this.mediumConfidenceDecoration.dispose();
    this.lowConfidenceDecoration.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}
