/**
 * Type Explorer Provider
 *
 * Provides a tree view of types in the current document.
 */

import * as vscode from 'vscode';

import type { AnalysisManager, InferenceResult } from '../analysis';

/**
 * Tree item for a type inference
 */
export class TypeTreeItem extends vscode.TreeItem {
  constructor(
    public readonly inference: InferenceResult,
    public readonly document: vscode.TextDocument
  ) {
    const confidencePercent = Math.round(inference.confidence * 100);
    const label = `${inference.type} (${confidencePercent}%)`;

    super(label, vscode.TreeItemCollapsibleState.None);

    this.tooltip = this.createTooltip();
    this.iconPath = this.getIcon();
    this.command = this.createCommand();
    this.contextValue = 'typeInference';
  }

  /**
   * Create tooltip
   */
  private createTooltip(): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    const [low, high] = this.inference.confidenceInterval;

    md.appendMarkdown(`**Type:** \`${this.inference.type}\`\n\n`);
    md.appendMarkdown(`**Confidence:** ${Math.round(this.inference.confidence * 100)}%\n\n`);
    md.appendMarkdown(`**CI:** [${Math.round(low * 100)}%, ${Math.round(high * 100)}%]\n\n`);
    md.appendMarkdown(`**Location:** Line ${this.inference.range.start.line + 1}`);

    return md;
  }

  /**
   * Get icon based on confidence
   */
  private getIcon(): vscode.ThemeIcon {
    const confidence = this.inference.confidence;

    if (confidence >= 0.85) {
      return new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'));
    } else if (confidence >= 0.6) {
      return new vscode.ThemeIcon('question', new vscode.ThemeColor('charts.yellow'));
    } else {
      return new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.red'));
    }
  }

  /**
   * Create command to go to location
   */
  private createCommand(): vscode.Command {
    return {
      command: 'vscode.open',
      title: 'Go to type',
      arguments: [
        this.document.uri,
        {
          selection: this.inference.range,
        },
      ],
    };
  }
}

/**
 * Provides a tree view of types
 */
export class TypeExplorerProvider implements vscode.TreeDataProvider<TypeTreeItem> {
  private readonly analysisManager: AnalysisManager;
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<
    TypeTreeItem | undefined | null | void
  >();

  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  constructor(analysisManager: AnalysisManager) {
    this.analysisManager = analysisManager;
  }

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this.onDidChangeTreeDataEmitter.fire();
  }

  /**
   * Get tree item
   */
  getTreeItem(element: TypeTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children
   */
  getChildren(element?: TypeTreeItem): vscode.ProviderResult<TypeTreeItem[]> {
    if (element) {
      // No nested items
      return [];
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return [];
    }

    const analysis = this.analysisManager.getCachedAnalysis(editor.document.uri);
    if (!analysis) {
      return [];
    }

    // Sort by confidence (lowest first for easy identification of issues)
    const sortedInferences = [...analysis.inferences].sort((a, b) => a.confidence - b.confidence);

    return sortedInferences.map((inference) => new TypeTreeItem(inference, editor.document));
  }

  dispose(): void {
    this.onDidChangeTreeDataEmitter.dispose();
  }
}
