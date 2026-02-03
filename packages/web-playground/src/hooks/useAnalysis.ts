/**
 * useAnalysis Hook
 *
 * Hook for managing type analysis.
 */

import { useCallback, useEffect, useRef } from 'react';
import { usePlaygroundStore, type InferenceResult } from '../store';

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 750;

/**
 * Mock analysis function
 * In production, this would use @ptl/core
 */
async function analyzeCode(code: string): Promise<InferenceResult[]> {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        const inferences: InferenceResult[] = [];
        const lines = code.split('\n');
        let id = 0;

        lines.forEach((line, lineIndex) => {
          // Function parameters
          const functionMatch = line.match(/function\s+(\w+)\s*\(([^)]*)\)/);
          if (functionMatch) {
            const params = functionMatch[2].split(',').filter((p) => p.trim());
            params.forEach((param) => {
              const col = line.indexOf(param.trim());
              inferences.push({
                id: `${id++}`,
                type: 'any',
                confidence: 0.45 + Math.random() * 0.3,
                confidenceInterval: [0.3, 0.7] as [number, number],
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
            const varName = varMatch[1];
            const col = line.indexOf(varName);
            let inferredType = 'unknown';
            let confidence = 0.5;

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
              confidenceInterval: [confidence - 0.1, Math.min(confidence + 0.05, 1)] as [
                number,
                number,
              ],
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
      300 + Math.random() * 400
    );
  });
}

/**
 * Hook for managing analysis
 */
export function useAnalysis() {
  const { code, setAnalysis, startAnalysis, setAnalysisError } = usePlaygroundStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const runAnalysis = useCallback(async () => {
    startAnalysis();
    const startTime = performance.now();

    try {
      const inferences = await analyzeCode(code);
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
  }, [code, setAnalysis, startAnalysis, setAnalysisError]);

  // Debounced analysis
  const debouncedAnalysis = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(runAnalysis, DEBOUNCE_DELAY);
  }, [runAnalysis]);

  // Run analysis when code changes
  useEffect(() => {
    debouncedAnalysis();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [debouncedAnalysis]);

  return {
    runAnalysis,
  };
}
