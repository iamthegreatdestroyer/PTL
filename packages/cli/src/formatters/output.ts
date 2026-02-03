/**
 * Output Formatter
 *
 * Format inference results for display.
 */

import chalk from 'chalk';
import figures from 'figures';

import type { InferenceResult } from '@ptl/core';

export interface FormatOptions {
  readonly color: boolean;
  readonly showConfidenceIntervals: boolean;
  readonly showAlternatives: boolean;
}

const DEFAULT_OPTIONS: FormatOptions = {
  color: true,
  showConfidenceIntervals: true,
  showAlternatives: true,
};

/**
 * Format inference output
 */
export function formatOutput(
  results: readonly InferenceResult[],
  options: Partial<FormatOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];

  for (const result of results) {
    lines.push(formatInference(result, opts));
  }

  return lines.join('\n');
}

/**
 * Format a single inference result
 */
function formatInference(result: InferenceResult, options: FormatOptions): string {
  const c = options.color ? chalk : createNoopChalk();

  const confidence = result.confidence;
  const confidencePercent = Math.round(confidence * 100);

  // Color based on confidence
  const colorFn = confidence >= 0.8 ? c.green : confidence >= 0.5 ? c.yellow : c.red;

  const icon =
    confidence >= 0.8 ? figures.tick : confidence >= 0.5 ? figures.warning : figures.cross;

  let line = `${colorFn(icon)} ${c.bold(result.type)}`;

  // Add confidence
  line += ` ${c.gray('(')}${colorFn(confidencePercent + '%')}${c.gray(')')}`;

  // Add confidence interval
  if (options.showConfidenceIntervals && result.confidenceInterval) {
    const [low, high] = result.confidenceInterval;
    line += ` ${c.gray(`[${Math.round(low * 100)}%-${Math.round(high * 100)}%]`)}`;
  }

  return line;
}

/**
 * Format type name for display
 */
export function formatType(type: string, options: { color?: boolean } = {}): string {
  const c = options.color !== false ? chalk : createNoopChalk();

  // Highlight type keywords
  return type
    .replace(/\b(string|number|boolean|null|undefined|void|never|any|unknown)\b/g, c.blue('$1'))
    .replace(/\b(Array|Promise|Map|Set|Record)\b/g, c.cyan('$1'))
    .replace(/\b([A-Z][a-zA-Z0-9]*)\b/g, c.magenta('$1'));
}

/**
 * Format confidence value
 */
export function formatConfidence(
  confidence: number,
  options: { color?: boolean; showInterval?: [number, number] } = {}
): string {
  const c = options.color !== false ? chalk : createNoopChalk();

  const percent = Math.round(confidence * 100);
  const colorFn = confidence >= 0.8 ? c.green : confidence >= 0.5 ? c.yellow : c.red;

  let result = colorFn(`${percent}%`);

  if (options.showInterval) {
    const [low, high] = options.showInterval;
    result += c.gray(` [${Math.round(low * 100)}%-${Math.round(high * 100)}%]`);
  }

  return result;
}

/**
 * Create a no-op chalk instance for non-colored output
 */
function createNoopChalk() {
  const identity = <T>(s: T): T => s;
  return {
    bold: identity,
    green: identity,
    yellow: identity,
    red: identity,
    blue: identity,
    cyan: identity,
    magenta: identity,
    gray: identity,
  };
}
