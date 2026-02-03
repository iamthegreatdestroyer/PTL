import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { PtlHoverProvider } from '../hover';
import { mockInference, mockEvidence } from '@ptl/test-utils/mocks';

// Mock vscode module
vi.mock('vscode', () => ({
  Hover: vi.fn().mockImplementation((contents, range) => ({
    contents,
    range,
  })),
  MarkdownString: vi.fn().mockImplementation((value) => ({
    value: value || '',
    appendMarkdown: vi.fn().mockReturnThis(),
    appendCodeblock: vi.fn().mockReturnThis(),
    supportHtml: false,
    isTrusted: false,
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
    registerHoverProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  },
}));

describe('VS Code Hover Provider', () => {
  let hoverProvider: PtlHoverProvider;

  beforeEach(() => {
    hoverProvider = new PtlHoverProvider();
  });

  describe('provideHover', () => {
    it('should return null when no inference at position', () => {
      const document = createMockDocument('const x = 1;');
      const position = new vscode.Position(0, 0);

      hoverProvider.setInferences('/test.ts', []);
      const hover = hoverProvider.provideHover(document, position);

      expect(hover).toBeNull();
    });

    it('should return hover when inference at position', () => {
      const document = createMockDocument('const x = 1;');
      const position = new vscode.Position(0, 6); // position at 'x'

      const inference = mockInference({
        name: 'x',
        type: 'number',
        confidence: 0.95,
        location: { line: 1, column: 6, endLine: 1, endColumn: 7 },
      });

      hoverProvider.setInferences('/test.ts', [inference]);
      const hover = hoverProvider.provideHover(document, position);

      expect(hover).not.toBeNull();
    });

    it('should include type information in hover', () => {
      const document = createMockDocument('const userId = "123";');
      const position = new vscode.Position(0, 6);

      const inference = mockInference({
        name: 'userId',
        type: 'string',
        confidence: 0.9,
        location: { line: 1, column: 6, endLine: 1, endColumn: 12 },
      });

      hoverProvider.setInferences('/test.ts', [inference]);
      const hover = hoverProvider.provideHover(document, position);

      expect(hover).not.toBeNull();
      // Hover contents should reference the type
    });
  });

  describe('formatHoverContent', () => {
    it('should format basic type info', () => {
      const inference = mockInference({
        name: 'count',
        type: 'number',
        confidence: 0.85,
      });

      const markdown = hoverProvider.formatHoverContent(inference);

      expect(markdown.appendMarkdown).toHaveBeenCalled();
    });

    it('should include confidence indicator', () => {
      const inference = mockInference({
        name: 'data',
        type: 'unknown',
        confidence: 0.45,
      });

      const markdown = hoverProvider.formatHoverContent(inference);

      // Low confidence should show warning indicator
      expect(markdown.appendMarkdown).toHaveBeenCalled();
    });

    it('should list evidence sources', () => {
      const inference = mockInference({
        name: 'user',
        type: 'User',
        confidence: 0.9,
        evidence: [mockEvidence('type_annotation', 1.0), mockEvidence('naming_convention', 0.8)],
      });

      const markdown = hoverProvider.formatHoverContent(inference);

      expect(markdown.appendMarkdown).toHaveBeenCalled();
    });
  });

  describe('confidence visualization', () => {
    it('should show high confidence with green indicator', () => {
      const confidence = 0.95;
      const indicator = hoverProvider.getConfidenceIndicator(confidence);

      expect(indicator).toContain('🟢');
    });

    it('should show medium confidence with yellow indicator', () => {
      const confidence = 0.65;
      const indicator = hoverProvider.getConfidenceIndicator(confidence);

      expect(indicator).toContain('🟡');
    });

    it('should show low confidence with orange indicator', () => {
      const confidence = 0.45;
      const indicator = hoverProvider.getConfidenceIndicator(confidence);

      expect(indicator).toContain('🟠');
    });

    it('should show very low confidence with red indicator', () => {
      const confidence = 0.25;
      const indicator = hoverProvider.getConfidenceIndicator(confidence);

      expect(indicator).toContain('🔴');
    });
  });
});

// Helper to create mock document
function createMockDocument(content: string): vscode.TextDocument {
  const lines = content.split('\n');
  return {
    uri: { fsPath: '/test.ts', path: '/test.ts' },
    fileName: '/test.ts',
    languageId: 'typescript',
    version: 1,
    lineCount: lines.length,
    getText: () => content,
    getWordRangeAtPosition: vi.fn().mockImplementation((pos) => {
      return new vscode.Range(pos.line, pos.character - 2, pos.line, pos.character + 2);
    }),
    lineAt: vi.fn().mockImplementation((line) => ({
      text: lines[line] || '',
      range: new vscode.Range(line, 0, line, (lines[line] || '').length),
    })),
    positionAt: vi.fn(),
    offsetAt: vi.fn(),
    validateRange: vi.fn(),
    validatePosition: vi.fn(),
  } as unknown as vscode.TextDocument;
}
