/**
 * Commands Manager
 *
 * Registers and manages VS Code commands.
 */

import * as vscode from 'vscode';

import type { AnalysisManager } from './analysis';
import type { DiagnosticsManager } from './features/diagnostics';
import type { ConfigurationManager } from './configuration';

/**
 * Manages extension commands
 */
export class CommandsManager implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    _context: vscode.ExtensionContext,
    private readonly analysisManager: AnalysisManager,
    private readonly diagnosticsManager: DiagnosticsManager,
    private readonly configManager: ConfigurationManager
  ) {
    this.registerCommands();
  }

  /**
   * Register all commands
   */
  private registerCommands(): void {
    // Analyze current file
    this.disposables.push(
      vscode.commands.registerCommand('ptl.analyze', () => this.analyzeCurrentFile())
    );

    // Analyze workspace
    this.disposables.push(
      vscode.commands.registerCommand('ptl.analyzeWorkspace', () => this.analyzeWorkspace())
    );

    // Show type info
    this.disposables.push(
      vscode.commands.registerCommand('ptl.showTypeInfo', () => this.showTypeInfo())
    );

    // Toggle inline hints
    this.disposables.push(
      vscode.commands.registerCommand('ptl.toggleInlineHints', () => this.toggleInlineHints())
    );

    // Open lattice view
    this.disposables.push(
      vscode.commands.registerCommand('ptl.openLatticeView', () => this.openLatticeView())
    );
  }

  /**
   * Analyze the current file
   */
  private async analyzeCurrentFile(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      void vscode.window.showWarningMessage('No active editor');
      return;
    }

    const document = editor.document;
    if (document.languageId !== 'typescript' && document.languageId !== 'typescriptreact') {
      void vscode.window.showWarningMessage('PTL only analyzes TypeScript files');
      return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'PTL: Analyzing file...',
        cancellable: false,
      },
      async () => {
        try {
          const results = await this.analysisManager.analyzeDocument(document);
          this.diagnosticsManager.updateDiagnostics(document.uri, results);

          const inferenceCount = results.inferences.length;
          const lowConfidence = results.inferences.filter(
            (i) => i.confidence < this.configManager.getLowConfidenceThreshold()
          ).length;

          void vscode.window.showInformationMessage(
            `PTL: ${inferenceCount} types inferred, ${lowConfidence} with low confidence`
          );
        } catch (error) {
          void vscode.window.showErrorMessage(
            `PTL analysis failed: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    );
  }

  /**
   * Analyze all TypeScript files in the workspace
   */
  private async analyzeWorkspace(): Promise<void> {
    const files = await vscode.workspace.findFiles('**/*.{ts,tsx}', '**/node_modules/**');

    if (files.length === 0) {
      void vscode.window.showWarningMessage('No TypeScript files found in workspace');
      return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'PTL: Analyzing workspace...',
        cancellable: true,
      },
      async (progress, token) => {
        let analyzed = 0;
        let totalInferences = 0;

        for (const file of files) {
          if (token.isCancellationRequested) {
            break;
          }

          progress.report({
            message: `${analyzed}/${files.length} files`,
            increment: 100 / files.length,
          });

          try {
            const document = await vscode.workspace.openTextDocument(file);
            const results = await this.analysisManager.analyzeDocument(document);
            this.diagnosticsManager.updateDiagnostics(document.uri, results);
            totalInferences += results.inferences.length;
          } catch {
            // Skip files that can't be analyzed
          }

          analyzed++;
        }

        void vscode.window.showInformationMessage(
          `PTL: Analyzed ${analyzed} files, ${totalInferences} types inferred`
        );
      }
    );
  }

  /**
   * Show type information at cursor
   */
  private async showTypeInfo(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const position = editor.selection.active;
    const inference = this.analysisManager.getInferenceAt(editor.document.uri, position);

    if (!inference) {
      void vscode.window.showInformationMessage('No type information at cursor');
      return;
    }

    const confidencePercent = Math.round(inference.confidence * 100);
    const [low, high] = inference.confidenceInterval;

    let message = `**Type:** \`${inference.type}\`\n\n`;
    message += `**Confidence:** ${confidencePercent}% [${Math.round(low * 100)}%-${Math.round(high * 100)}%]`;

    if (inference.alternatives && inference.alternatives.length > 0) {
      message += '\n\n**Alternatives:**\n';
      for (const alt of inference.alternatives) {
        message += `- \`${alt.type}\` (${Math.round(alt.confidence * 100)}%)\n`;
      }
    }

    // Show in a hover-style panel
    const panel = vscode.window.createWebviewPanel(
      'ptlTypeInfo',
      'PTL Type Information',
      vscode.ViewColumn.Beside,
      { enableScripts: false }
    );

    panel.webview.html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: var(--vscode-font-family); padding: 16px; }
          code { background: var(--vscode-textCodeBlock-background); padding: 2px 4px; }
        </style>
      </head>
      <body>
        <h2>Type Information</h2>
        <p><strong>Type:</strong> <code>${inference.type}</code></p>
        <p><strong>Confidence:</strong> ${confidencePercent}% [${Math.round(low * 100)}%-${Math.round(high * 100)}%]</p>
        ${inference.isInferred ? '<p><em>This type was inferred by PTL</em></p>' : ''}
      </body>
      </html>
    `;
  }

  /**
   * Toggle inline confidence hints
   */
  private toggleInlineHints(): void {
    const config = vscode.workspace.getConfiguration('ptl');
    const current = config.get<boolean>('showInlineHints', true);

    void config.update('showInlineHints', !current, vscode.ConfigurationTarget.Global);

    void vscode.window.showInformationMessage(
      `PTL inline hints ${!current ? 'enabled' : 'disabled'}`
    );
  }

  /**
   * Open the type lattice visualization
   */
  private openLatticeView(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      void vscode.window.showWarningMessage('No active editor');
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'ptlLatticeView',
      'PTL Type Lattice',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    // TODO: Implement actual lattice visualization
    panel.webview.html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .placeholder {
            text-align: center;
            color: var(--vscode-descriptionForeground);
          }
        </style>
      </head>
      <body>
        <div class="placeholder">
          <h2>Type Lattice Visualization</h2>
          <p>Coming soon...</p>
          <p>This will display an interactive visualization of the type lattice.</p>
        </div>
      </body>
      </html>
    `;
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}
