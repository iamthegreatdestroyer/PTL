import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { PtlDiagnosticProvider } from '../diagnostics';
import { mockInference, mockEvidence } from '@ptl/test-utils/mocks';

// Mock vscode module
vi.mock('vscode', () => ({
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3,
  },
  Diagnostic: vi.fn().mockImplementation((range, message, severity) => ({
    range,
    message,
    severity,
  })),
  Range: vi.fn().mockImplementation((sl, sc, el, ec) => ({
    start: { line: sl, character: sc },
    end: { line: el, character: ec },
  })),
  Position: vi.fn().mockImplementation((line, character) => ({
    line,
    character,
  })),
  languages: {
    createDiagnosticCollection: vi.fn().mockReturnValue({
      set: vi.fn(),
      clear: vi.fn(),
      delete: vi.fn(),
      dispose: vi.fn(),
    }),
  },
  Uri: {
    file: vi.fn().mockImplementation((path) => ({ fsPath: path, path })),
    parse: vi.fn().mockImplementation((str) => ({ fsPath: str, path: str })),
  },
  window: {
    showInformationMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showErrorMessage: vi.fn(),
  },
  workspace: {
    getConfiguration: vi.fn().mockReturnValue({
      get: vi.fn().mockReturnValue(true),
    }),
    onDidChangeConfiguration: vi.fn(),
    onDidSaveTextDocument: vi.fn(),
    onDidChangeTextDocument: vi.fn(),
  },
}));

describe('VS Code Diagnostic Provider', () => {
  let diagnosticProvider: PtlDiagnosticProvider;
  let mockCollection: any;

  beforeEach(() => {
    mockCollection = {
      set: vi.fn(),
      clear: vi.fn(),
      delete: vi.fn(),
      dispose: vi.fn(),
    };
    vi.mocked(vscode.languages.createDiagnosticCollection).mockReturnValue(mockCollection);
    diagnosticProvider = new PtlDiagnosticProvider();
  });

  describe('createDiagnostics', () => {
    it('should create diagnostics from inference results', () => {
      const inference = mockInference({
        name: 'userId',
        type: 'string',
        confidence: 0.95,
        location: { line: 10, column: 5, endLine: 10, endColumn: 11 },
      });

      const diagnostics = diagnosticProvider.createDiagnostics([inference]);

      expect(diagnostics).toHaveLength(1);
    });

    it('should set appropriate severity based on confidence', () => {
      const highConfidence = mockInference({
        name: 'x',
        type: 'number',
        confidence: 0.95,
        location: { line: 1, column: 1, endLine: 1, endColumn: 5 },
      });

      const lowConfidence = mockInference({
        name: 'y',
        type: 'any',
        confidence: 0.45,
        location: { line: 2, column: 1, endLine: 2, endColumn: 5 },
      });

      const highDiag = diagnosticProvider.createDiagnostics([highConfidence]);
      const lowDiag = diagnosticProvider.createDiagnostics([lowConfidence]);

      // High confidence should be informational
      expect(highDiag[0].severity).toBe(vscode.DiagnosticSeverity.Information);
      // Low confidence should be warning
      expect(lowDiag[0].severity).toBe(vscode.DiagnosticSeverity.Warning);
    });

    it('should filter diagnostics below minimum confidence', () => {
      const lowConfidence = mockInference({
        name: 'x',
        confidence: 0.3,
        location: { line: 1, column: 1, endLine: 1, endColumn: 5 },
      });

      diagnosticProvider.setMinConfidence(0.5);
      const diagnostics = diagnosticProvider.createDiagnostics([lowConfidence]);

      expect(diagnostics).toHaveLength(0);
    });
  });

  describe('updateDiagnostics', () => {
    it('should update diagnostic collection for document', () => {
      const mockUri = { fsPath: '/test.ts', path: '/test.ts' };
      const inference = mockInference({
        name: 'test',
        confidence: 0.9,
        location: { line: 1, column: 1, endLine: 1, endColumn: 10 },
      });

      diagnosticProvider.updateDiagnostics(mockUri as any, [inference]);

      expect(mockCollection.set).toHaveBeenCalled();
    });

    it('should clear diagnostics when no inferences', () => {
      const mockUri = { fsPath: '/test.ts', path: '/test.ts' };

      diagnosticProvider.updateDiagnostics(mockUri as any, []);

      expect(mockCollection.set).toHaveBeenCalledWith(mockUri, []);
    });
  });

  describe('dispose', () => {
    it('should dispose diagnostic collection', () => {
      diagnosticProvider.dispose();

      expect(mockCollection.dispose).toHaveBeenCalled();
    });
  });
});

describe('Diagnostic Message Formatting', () => {
  let diagnosticProvider: PtlDiagnosticProvider;

  beforeEach(() => {
    diagnosticProvider = new PtlDiagnosticProvider();
  });

  it('should format message with type and confidence', () => {
    const inference = mockInference({
      name: 'userId',
      type: 'string',
      confidence: 0.85,
      location: { line: 1, column: 1, endLine: 1, endColumn: 10 },
    });

    const diagnostics = diagnosticProvider.createDiagnostics([inference]);

    expect(diagnostics[0].message).toContain('string');
    expect(diagnostics[0].message).toContain('85%');
  });

  it('should include evidence count in message', () => {
    const inference = mockInference({
      name: 'userId',
      type: 'string',
      confidence: 0.85,
      evidence: [mockEvidence('naming_convention', 0.8), mockEvidence('assignment', 0.9)],
      location: { line: 1, column: 1, endLine: 1, endColumn: 10 },
    });

    const diagnostics = diagnosticProvider.createDiagnostics([inference]);

    expect(diagnostics[0].message).toContain('2');
  });
});
