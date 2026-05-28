import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Editor } from './components/Editor';
import { ResultsPanel } from './components/ResultsPanel';
import { LatticeViewer } from './components/LatticeViewer';
import { SettingsModal } from './components/SettingsModal';
import { usePlaygroundStore, type InferenceResult } from './store';

/**
 * Mock analysis function - will be replaced with actual @ptl/core integration
 */
function mockAnalyze(code: string): Promise<InferenceResult[]> {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        const inferences: InferenceResult[] = [];
        const lines = code.split('\n');
        let id = 0;

        lines.forEach((line, lineIndex) => {
          // Simple heuristic-based mock inference
          const functionMatch = line.match(/function\s+(\w+)\s*\(([^)]*)\)/);
          if (functionMatch) {
            const params = (functionMatch[2] ?? '').split(',').filter((p) => p.trim());
            params.forEach((param) => {
              const col = line.indexOf(param.trim());
              inferences.push({
                id: `${id++}`,
                type: 'any',
                confidence: 0.45 + Math.random() * 0.3,
                confidenceInterval: [0.3, 0.7],
                location: {
                  line: lineIndex + 1,
                  column: col,
                  endLine: lineIndex + 1,
                  endColumn: col + param.trim().length,
                },
                alternatives: [
                  { type: 'unknown', confidence: 0.3 },
                  { type: 'number', confidence: 0.2 },
                ],
              });
            });
          }

          // Variable declarations
          const varMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=/);
          if (varMatch) {
            const varName = varMatch[1] ?? '';
            const col = line.indexOf(varName);
            let inferredType = 'unknown';
            let confidence = 0.5;

            // Infer from value
            if (line.includes('"') || line.includes("'")) {
              inferredType = 'string';
              confidence = 0.92;
            } else if (/=\s*\d+/.test(line)) {
              inferredType = 'number';
              confidence = 0.95;
            } else if (line.includes('true') || line.includes('false')) {
              inferredType = 'boolean';
              confidence = 0.98;
            } else if (line.includes('{')) {
              inferredType = 'object';
              confidence = 0.85;
            } else if (line.includes('[')) {
              inferredType = 'array';
              confidence = 0.88;
            }

            inferences.push({
              id: `${id++}`,
              type: inferredType,
              confidence,
              confidenceInterval: [confidence - 0.1, Math.min(confidence + 0.05, 1)],
              location: {
                line: lineIndex + 1,
                column: col,
                endLine: lineIndex + 1,
                endColumn: col + varName.length,
              },
              alternatives:
                confidence < 0.9
                  ? [
                      { type: 'any', confidence: 0.2 },
                      { type: 'unknown', confidence: 0.15 },
                    ]
                  : [],
            });
          }
        });

        resolve(inferences);
      },
      500 + Math.random() * 500
    );
  });
}

function App() {
  const {
    code,
    setCode,
    analysis,
    setAnalysis,
    startAnalysis,
    setAnalysisError,
    showLattice,
    showSettings,
  } = usePlaygroundStore();

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Analyze code with debounce
  const analyzeCode = useCallback(
    async (codeToAnalyze: string) => {
      startAnalysis();
      const startTime = performance.now();

      try {
        const inferences = await mockAnalyze(codeToAnalyze);
        const analysisTime = performance.now() - startTime;

        setAnalysis({
          inferences,
          isAnalyzing: false,
          error: null,
          analysisTime,
        });
      } catch (error) {
        setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
      }
    },
    [setAnalysis, startAnalysis, setAnalysisError]
  );

  // Handle code changes with debounce
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode);

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(() => {
        analyzeCode(newCode);
      }, 750);

      setDebounceTimer(timer);
    },
    [debounceTimer, setCode, analyzeCode]
  );

  // Initial analysis
  useEffect(() => {
    analyzeCode(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-screen bg-ptl-bg">
      <Header onAnalyze={() => analyzeCode(code)} />

      <main className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <Editor code={code} onChange={handleCodeChange} inferences={analysis.inferences} />
        </div>

        {/* Divider */}
        <div className="w-px bg-ptl-border" />

        {/* Results Panel */}
        <div className="w-[400px] flex-shrink-0">
          <ResultsPanel />
        </div>
      </main>

      {/* Modals */}
      {showLattice && <LatticeViewer />}
      {showSettings && <SettingsModal />}
    </div>
  );
}

export default App;
