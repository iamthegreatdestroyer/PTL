/**
 * Editor Component
 *
 * Monaco-based code editor with inline hints.
 */

import { useRef, useEffect } from 'react';
import MonacoEditor, { OnMount, OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

import { usePlaygroundStore, type InferenceResult } from '../store';

interface EditorProps {
  code: string;
  onChange: (code: string) => void;
  inferences: InferenceResult[];
}

export function Editor({ code, onChange, inferences }: EditorProps) {
  const { settings, selectInference, selectedInferenceId } = usePlaygroundStore();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  // Handle editor mount
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define custom theme
    monaco.editor.defineTheme('ptl-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#5a5a5a',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editor.selectionBackground': '#264f78',
        'editor.lineHighlightBackground': '#2a2d2e',
      },
    });

    monaco.editor.setTheme('ptl-dark');

    // Handle cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      const position = e.position;
      const inference = inferences.find(
        (inf) =>
          inf.location.line === position.lineNumber &&
          inf.location.column <= position.column &&
          inf.location.endColumn >= position.column
      );
      selectInference(inference?.id || null);
    });
  };

  // Handle code changes
  const handleChange: OnChange = (value) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  // Update decorations when inferences change
  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const monaco = (window as any).monaco;

    if (!monaco) return;

    // Create decorations for inferences
    const newDecorations: editor.IModelDeltaDecoration[] = inferences.map((inf) => {
      const isSelected = inf.id === selectedInferenceId;
      const confidence = inf.confidence;

      let className = 'ptl-inference-high';
      if (confidence < 0.6) {
        className = 'ptl-inference-low';
      } else if (confidence < 0.85) {
        className = 'ptl-inference-medium';
      }

      if (isSelected) {
        className += ' ptl-inference-selected';
      }

      return {
        range: new monaco.Range(
          inf.location.line,
          inf.location.column,
          inf.location.endLine,
          inf.location.endColumn
        ),
        options: {
          inlineClassName: className,
          hoverMessage: {
            value: `**${inf.type}** (${Math.round(inf.confidence * 100)}% confidence)`,
          },
          afterContentClassName: `ptl-inference-badge ${className}`,
          after: {
            content: `: ${inf.type} ${Math.round(inf.confidence * 100)}%`,
            inlineClassName: 'ptl-inline-hint',
          },
        },
      };
    });

    // Apply decorations
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [inferences, selectedInferenceId]);

  return (
    <div className="flex-1 relative">
      <MonacoEditor
        height="100%"
        language="typescript"
        value={code}
        onChange={handleChange}
        onMount={handleEditorMount}
        options={{
          fontSize: settings.fontSize,
          fontFamily: "'JetBrains Mono', monospace",
          lineNumbers: settings.showLineNumbers ? 'on' : 'off',
          minimap: { enabled: settings.minimap },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
        }}
      />

      {/* Custom CSS for decorations */}
      <style>{`
        .ptl-inference-high {
          border-bottom: 2px solid rgba(34, 197, 94, 0.4);
        }
        .ptl-inference-medium {
          border-bottom: 2px solid rgba(234, 179, 8, 0.4);
        }
        .ptl-inference-low {
          border-bottom: 2px dashed rgba(239, 68, 68, 0.6);
        }
        .ptl-inference-selected {
          background-color: rgba(0, 122, 204, 0.2);
        }
        .ptl-inline-hint {
          color: rgba(212, 212, 212, 0.4);
          font-size: 0.85em;
          margin-left: 0.5em;
        }
      `}</style>
    </div>
  );
}
