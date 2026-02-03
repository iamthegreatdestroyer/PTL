/**
 * Diagnostics Manager
 *
 * Manages VS Code diagnostics for PTL analysis results.
 */

import * as vscode from 'vscode';

import type { ConfigurationManager } from '../configuration';
import type { DocumentAnalysis, InferenceResult } from '../analysis';

/**
 * Diagnostic codes for PTL
 */
export enum PTLDiagnosticCode {
  LowConfidence = 'PTL001',
  AmbiguousType = 'PTL002',
  InferenceError = 'PTL003',
}

/**
 * Manages diagnostics collection and updates
 */
export class DiagnosticsManager implements vscode.Disposable {
  private readonly diagnosticCollection: vscode.DiagnosticCollection;
  private readonly configManager: ConfigurationManager;

  constructor(configManager: ConfigurationManager) {
    this.configManager = configManager;
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('ptl');
  }

  /**
   * Update diagnostics for a document
   */
  updateDiagnostics(uri: vscode.Uri, analysis: DocumentAnalysis): void {
    if (!this.configManager.diagnosticsEnabled()) {
      this.diagnosticCollection.delete(uri);
      return;
    }

    const diagnostics: vscode.Diagnostic[] = [];
    const threshold = this.configManager.getLowConfidenceThreshold();
    const severity = this.configManager.getDiagnosticSeverity();

    // Create diagnostics for low-confidence inferences
    for (const inference of analysis.inferences) {
      if (inference.confidence < threshold) {
        const diagnostic = this.createLowConfidenceDiagnostic(inference, severity);
        diagnostics.push(diagnostic);
      }

      // Check for ambiguous types (multiple alternatives with similar confidence)
      if (this.isAmbiguous(inference)) {
        const diagnostic = this.createAmbiguousDiagnostic(inference, severity);
        diagnostics.push(diagnostic);
      }
    }

    // Create diagnostics for analysis errors
    for (const error of analysis.errors) {
      const diagnostic = this.createErrorDiagnostic(error);
      diagnostics.push(diagnostic);
    }

    this.diagnosticCollection.set(uri, diagnostics);
  }

  /**
   * Clear diagnostics for a document
   */
  clearDiagnostics(uri: vscode.Uri): void {
    this.diagnosticCollection.delete(uri);
  }

  /**
   * Clear all diagnostics
   */
  clearAllDiagnostics(): void {
    this.diagnosticCollection.clear();
  }

  /**
   * Create a diagnostic for low-confidence inference
   */
  private createLowConfidenceDiagnostic(
    inference: InferenceResult,
    severity: vscode.DiagnosticSeverity
  ): vscode.Diagnostic {
    const confidencePercent = Math.round(inference.confidence * 100);
    const [low, high] = inference.confidenceInterval;

    const message = `Low confidence type inference: '${inference.type}' (${confidencePercent}%, CI: ${Math.round(low * 100)}%-${Math.round(high * 100)}%)`;

    const diagnostic = new vscode.Diagnostic(inference.range, message, severity);

    diagnostic.code = PTLDiagnosticCode.LowConfidence;
    diagnostic.source = 'PTL';

    // Add related information for alternatives
    if (inference.alternatives && inference.alternatives.length > 0) {
      diagnostic.relatedInformation = inference.alternatives.map((alt) => ({
        location: new vscode.Location(vscode.Uri.parse(''), inference.range),
        message: `Alternative: ${alt.type} (${Math.round(alt.confidence * 100)}%)`,
      }));
    }

    return diagnostic;
  }

  /**
   * Create a diagnostic for ambiguous type
   */
  private createAmbiguousDiagnostic(
    inference: InferenceResult,
    severity: vscode.DiagnosticSeverity
  ): vscode.Diagnostic {
    const alternatives = inference.alternatives || [];
    const altTypes = alternatives
      .slice(0, 3)
      .map((a) => `'${a.type}'`)
      .join(', ');

    const message = `Ambiguous type: could be ${altTypes}`;

    const diagnostic = new vscode.Diagnostic(inference.range, message, severity);

    diagnostic.code = PTLDiagnosticCode.AmbiguousType;
    diagnostic.source = 'PTL';

    return diagnostic;
  }

  /**
   * Create a diagnostic for analysis error
   */
  private createErrorDiagnostic(error: {
    message: string;
    range: vscode.Range;
    severity: 'error' | 'warning';
  }): vscode.Diagnostic {
    const severity =
      error.severity === 'error'
        ? vscode.DiagnosticSeverity.Error
        : vscode.DiagnosticSeverity.Warning;

    const diagnostic = new vscode.Diagnostic(error.range, error.message, severity);

    diagnostic.code = PTLDiagnosticCode.InferenceError;
    diagnostic.source = 'PTL';

    return diagnostic;
  }

  /**
   * Check if an inference is ambiguous
   */
  private isAmbiguous(inference: InferenceResult): boolean {
    if (!inference.alternatives || inference.alternatives.length === 0) {
      return false;
    }

    // Consider ambiguous if there's an alternative within 20% confidence
    const topAlternative = inference.alternatives[0];
    return topAlternative.confidence > inference.confidence - 0.2;
  }

  dispose(): void {
    this.diagnosticCollection.dispose();
  }
}
