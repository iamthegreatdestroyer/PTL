/**
 * PTL Extension
 *
 * Main extension class that coordinates all features.
 */

import * as vscode from 'vscode';

import { DiagnosticsManager } from './features/diagnostics';
import { InlineHintsProvider } from './features/inlineHints';
import { HoverProvider } from './features/hover';
import { CodeLensProvider } from './features/codeLens';
import { CommandsManager } from './commands';
import { ConfigurationManager } from './configuration';
import { AnalysisManager } from './analysis';
import { StatusBarManager } from './statusBar';

/**
 * Main extension coordinator
 */
export class PTLExtension {
  private readonly context: vscode.ExtensionContext;
  private readonly outputChannel: vscode.OutputChannel;

  // Managers
  private configManager: ConfigurationManager | undefined;
  private analysisManager: AnalysisManager | undefined;
  private diagnosticsManager: DiagnosticsManager | undefined;
  private statusBarManager: StatusBarManager | undefined;
  private commandsManager: CommandsManager | undefined;

  // Providers
  private inlineHintsProvider: InlineHintsProvider | undefined;
  private hoverProvider: HoverProvider | undefined;
  private codeLensProvider: CodeLensProvider | undefined;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.outputChannel = vscode.window.createOutputChannel('PTL');
    this.context.subscriptions.push(this.outputChannel);
  }

  /**
   * Activate the extension
   */
  async activate(): Promise<void> {
    this.log('Initializing PTL extension...');

    // Initialize configuration
    this.configManager = new ConfigurationManager();
    this.context.subscriptions.push(this.configManager);

    // Check if enabled
    if (!this.configManager.isEnabled()) {
      this.log('PTL is disabled in configuration');
      return;
    }

    // Initialize analysis manager
    this.analysisManager = new AnalysisManager(this.configManager, this.outputChannel);
    this.context.subscriptions.push(this.analysisManager);

    // Initialize diagnostics
    this.diagnosticsManager = new DiagnosticsManager(this.configManager);
    this.context.subscriptions.push(this.diagnosticsManager);

    // Initialize status bar
    this.statusBarManager = new StatusBarManager();
    this.context.subscriptions.push(this.statusBarManager);

    // Register providers
    await this.registerProviders();

    // Initialize commands
    this.commandsManager = new CommandsManager(
      this.context,
      this.analysisManager,
      this.diagnosticsManager,
      this.configManager
    );
    this.context.subscriptions.push(this.commandsManager);

    // Set up event handlers
    this.setupEventHandlers();

    // Initial analysis of open documents
    await this.analyzeOpenDocuments();

    this.log('PTL extension initialized successfully');
    this.statusBarManager.setReady();
  }

  /**
   * Deactivate the extension
   */
  async deactivate(): Promise<void> {
    this.log('Shutting down PTL extension...');

    // Cleanup is handled by disposables in context.subscriptions
    this.outputChannel.dispose();
  }

  /**
   * Register language feature providers
   */
  private async registerProviders(): Promise<void> {
    const selector: vscode.DocumentSelector = [
      { language: 'typescript', scheme: 'file' },
      { language: 'typescriptreact', scheme: 'file' },
    ];

    // Inline hints (inlay hints)
    if (this.configManager!.showInlineHints()) {
      this.inlineHintsProvider = new InlineHintsProvider(this.analysisManager!);
      this.context.subscriptions.push(
        vscode.languages.registerInlayHintsProvider(selector, this.inlineHintsProvider)
      );
    }

    // Hover provider
    this.hoverProvider = new HoverProvider(this.analysisManager!);
    this.context.subscriptions.push(
      vscode.languages.registerHoverProvider(selector, this.hoverProvider)
    );

    // Code lens
    this.codeLensProvider = new CodeLensProvider(this.analysisManager!, this.configManager!);
    this.context.subscriptions.push(
      vscode.languages.registerCodeLensProvider(selector, this.codeLensProvider)
    );

    this.log('Language providers registered');
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    // Document changes
    this.context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (this.isTypeScriptDocument(event.document)) {
          this.onDocumentChange(event.document);
        }
      })
    );

    // Document open
    this.context.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument((document) => {
        if (this.isTypeScriptDocument(document)) {
          void this.analyzeDocument(document);
        }
      })
    );

    // Document save
    this.context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        if (this.isTypeScriptDocument(document)) {
          void this.analyzeDocument(document);
        }
      })
    );

    // Configuration changes
    this.context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('ptl')) {
          this.onConfigurationChange();
        }
      })
    );
  }

  /**
   * Check if document is TypeScript
   */
  private isTypeScriptDocument(document: vscode.TextDocument): boolean {
    return document.languageId === 'typescript' || document.languageId === 'typescriptreact';
  }

  /**
   * Handle document changes
   */
  private onDocumentChange(document: vscode.TextDocument): void {
    // Debounced analysis
    this.analysisManager?.scheduleAnalysis(document);
  }

  /**
   * Handle configuration changes
   */
  private onConfigurationChange(): void {
    this.log('Configuration changed, reloading...');
    this.configManager?.reload();

    // Re-analyze all open documents
    void this.analyzeOpenDocuments();
  }

  /**
   * Analyze a single document
   */
  private async analyzeDocument(document: vscode.TextDocument): Promise<void> {
    if (!this.analysisManager || !this.diagnosticsManager) {
      return;
    }

    this.statusBarManager?.setAnalyzing();

    try {
      const results = await this.analysisManager.analyzeDocument(document);
      this.diagnosticsManager.updateDiagnostics(document.uri, results);
      this.statusBarManager?.setReady();
    } catch (error) {
      this.log(`Analysis error: ${error}`);
      this.statusBarManager?.setError('Analysis failed');
    }
  }

  /**
   * Analyze all open TypeScript documents
   */
  private async analyzeOpenDocuments(): Promise<void> {
    const documents = vscode.workspace.textDocuments.filter((doc) =>
      this.isTypeScriptDocument(doc)
    );

    for (const document of documents) {
      await this.analyzeDocument(document);
    }
  }

  /**
   * Log a message to the output channel
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    this.outputChannel.appendLine(`[${timestamp}] ${message}`);
  }
}
