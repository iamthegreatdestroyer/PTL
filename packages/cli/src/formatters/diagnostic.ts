/**
 * Diagnostic Formatter
 *
 * Format diagnostic messages for display.
 */

import chalk from 'chalk';
import figures from 'figures';

import type { DiagnosticMessage, SourceLocation } from '@ptl/core';

export interface DiagnosticFormatOptions {
  readonly color: boolean;
  readonly showCode: boolean;
  readonly contextLines: number;
}

const DEFAULT_OPTIONS: DiagnosticFormatOptions = {
  color: true,
  showCode: true,
  contextLines: 2,
};

/**
 * Format a diagnostic message
 */
export function formatDiagnostic(
  diagnostic: DiagnosticMessage,
  options: Partial<DiagnosticFormatOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const c = opts.color ? chalk : createNoopChalk();

  const lines: string[] = [];

  // Severity icon and color
  const { icon, colorFn } = getSeverityStyle(diagnostic.severity, c);

  // Main message line
  const location = diagnostic.location ? formatLocation(diagnostic.location) : '';

  const prefix = location ? `${c.cyan(location)}: ` : '';
  lines.push(`${prefix}${colorFn(icon)} ${colorFn(diagnostic.severity)}: ${diagnostic.message}`);

  // Code frame (if available)
  if (opts.showCode && diagnostic.codeFrame) {
    lines.push('');
    lines.push(formatCodeFrame(diagnostic.codeFrame, opts));
  }

  // Related diagnostics
  if (diagnostic.related && diagnostic.related.length > 0) {
    lines.push('');
    for (const related of diagnostic.related) {
      const relLoc = related.location ? formatLocation(related.location) : '';
      lines.push(c.gray(`  ↳ ${relLoc}: ${related.message}`));
    }
  }

  return lines.join('\n');
}

/**
 * Format source location
 */
export function formatLocation(location: SourceLocation): string {
  if (location.endLine !== undefined && location.endColumn !== undefined) {
    return `${location.file}:${location.line}:${location.column}-${location.endLine}:${location.endColumn}`;
  }
  return `${location.file}:${location.line}:${location.column}`;
}

/**
 * Format code frame
 */
function formatCodeFrame(codeFrame: string, options: DiagnosticFormatOptions): string {
  const c = options.color ? chalk : createNoopChalk();

  return codeFrame
    .split('\n')
    .map((line) => {
      // Highlight error markers (^^^^^)
      if (line.match(/^\s*\^+\s*$/)) {
        return c.red(line);
      }
      // Highlight line numbers
      return line.replace(/^(\s*\d+\s*\|)/, c.gray('$1'));
    })
    .join('\n');
}

/**
 * Get severity style
 */
function getSeverityStyle(
  severity: 'error' | 'warning' | 'info' | 'hint',
  c: typeof chalk
): { icon: string; colorFn: (s: string) => string } {
  switch (severity) {
    case 'error':
      return { icon: figures.cross, colorFn: c.red };
    case 'warning':
      return { icon: figures.warning, colorFn: c.yellow };
    case 'info':
      return { icon: figures.info, colorFn: c.blue };
    case 'hint':
      return { icon: figures.pointerSmall, colorFn: c.gray };
    default:
      return { icon: figures.bullet, colorFn: c.white };
  }
}

/**
 * Create a no-op chalk instance
 */
function createNoopChalk() {
  const identity = <T>(s: T): T => s;
  return {
    red: identity,
    yellow: identity,
    blue: identity,
    cyan: identity,
    gray: identity,
    white: identity,
  };
}
