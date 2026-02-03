/**
 * Configuration Manager
 *
 * Manages VS Code configuration for the PTL extension.
 */

import * as vscode from 'vscode';

/**
 * PTL configuration settings
 */
export interface PTLConfiguration {
  readonly enable: boolean;
  readonly configPath: string;
  readonly showInlineHints: boolean;
  readonly minConfidenceForHints: number;
  readonly highlightLowConfidence: boolean;
  readonly lowConfidenceThreshold: number;
  readonly diagnostics: {
    readonly enable: boolean;
    readonly severity: vscode.DiagnosticSeverity;
  };
  readonly inference: {
    readonly maxIterations: number;
  };
  readonly trace: {
    readonly server: 'off' | 'messages' | 'verbose';
  };
}

/**
 * Manages extension configuration
 */
export class ConfigurationManager implements vscode.Disposable {
  private config: PTLConfiguration;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly onDidChangeEmitter = new vscode.EventEmitter<PTLConfiguration>();

  /**
   * Event fired when configuration changes
   */
  readonly onDidChange = this.onDidChangeEmitter.event;

  constructor() {
    this.config = this.loadConfiguration();

    // Watch for configuration changes
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('ptl')) {
          this.reload();
        }
      })
    );
  }

  /**
   * Get current configuration
   */
  getConfiguration(): PTLConfiguration {
    return this.config;
  }

  /**
   * Check if PTL is enabled
   */
  isEnabled(): boolean {
    return this.config.enable;
  }

  /**
   * Check if inline hints are enabled
   */
  showInlineHints(): boolean {
    return this.config.showInlineHints;
  }

  /**
   * Get minimum confidence for showing hints
   */
  getMinConfidenceForHints(): number {
    return this.config.minConfidenceForHints;
  }

  /**
   * Check if low confidence highlighting is enabled
   */
  highlightLowConfidence(): boolean {
    return this.config.highlightLowConfidence;
  }

  /**
   * Get low confidence threshold
   */
  getLowConfidenceThreshold(): number {
    return this.config.lowConfidenceThreshold;
  }

  /**
   * Check if diagnostics are enabled
   */
  diagnosticsEnabled(): boolean {
    return this.config.diagnostics.enable;
  }

  /**
   * Get diagnostic severity
   */
  getDiagnosticSeverity(): vscode.DiagnosticSeverity {
    return this.config.diagnostics.severity;
  }

  /**
   * Reload configuration
   */
  reload(): void {
    const oldConfig = this.config;
    this.config = this.loadConfiguration();

    if (JSON.stringify(oldConfig) !== JSON.stringify(this.config)) {
      this.onDidChangeEmitter.fire(this.config);
    }
  }

  /**
   * Load configuration from VS Code settings
   */
  private loadConfiguration(): PTLConfiguration {
    const config = vscode.workspace.getConfiguration('ptl');

    return {
      enable: config.get<boolean>('enable', true),
      configPath: config.get<string>('configPath', ''),
      showInlineHints: config.get<boolean>('showInlineHints', true),
      minConfidenceForHints: config.get<number>('minConfidenceForHints', 0.5),
      highlightLowConfidence: config.get<boolean>('highlightLowConfidence', true),
      lowConfidenceThreshold: config.get<number>('lowConfidenceThreshold', 0.5),
      diagnostics: {
        enable: config.get<boolean>('diagnostics.enable', true),
        severity: this.parseSeverity(config.get<string>('diagnostics.severity', 'information')),
      },
      inference: {
        maxIterations: config.get<number>('inference.maxIterations', 100),
      },
      trace: {
        server: config.get<'off' | 'messages' | 'verbose'>('trace.server', 'off'),
      },
    };
  }

  /**
   * Parse severity string to DiagnosticSeverity
   */
  private parseSeverity(severity: string): vscode.DiagnosticSeverity {
    switch (severity) {
      case 'error':
        return vscode.DiagnosticSeverity.Error;
      case 'warning':
        return vscode.DiagnosticSeverity.Warning;
      case 'hint':
        return vscode.DiagnosticSeverity.Hint;
      case 'information':
      default:
        return vscode.DiagnosticSeverity.Information;
    }
  }

  dispose(): void {
    this.onDidChangeEmitter.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}
