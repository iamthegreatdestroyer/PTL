import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseArgs, validateOptions } from '../parser';

describe('CLI Argument Parser', () => {
  describe('parseArgs', () => {
    it('should parse analyze command with file path', () => {
      const args = ['analyze', 'src/index.ts'];
      const result = parseArgs(args);

      expect(result.command).toBe('analyze');
      expect(result.files).toContain('src/index.ts');
    });

    it('should parse analyze command with glob pattern', () => {
      const args = ['analyze', 'src/**/*.ts'];
      const result = parseArgs(args);

      expect(result.command).toBe('analyze');
      expect(result.files).toContain('src/**/*.ts');
    });

    it('should parse multiple files', () => {
      const args = ['analyze', 'src/a.ts', 'src/b.ts', 'src/c.ts'];
      const result = parseArgs(args);

      expect(result.files).toHaveLength(3);
    });

    it('should parse --format option', () => {
      const args = ['analyze', 'src/index.ts', '--format', 'json'];
      const result = parseArgs(args);

      expect(result.options.format).toBe('json');
    });

    it('should parse --output option', () => {
      const args = ['analyze', 'src/index.ts', '--output', 'report.json'];
      const result = parseArgs(args);

      expect(result.options.output).toBe('report.json');
    });

    it('should parse --min-confidence option', () => {
      const args = ['analyze', 'src/index.ts', '--min-confidence', '0.8'];
      const result = parseArgs(args);

      expect(result.options.minConfidence).toBe(0.8);
    });

    it('should parse --strict flag', () => {
      const args = ['analyze', 'src/index.ts', '--strict'];
      const result = parseArgs(args);

      expect(result.options.strict).toBe(true);
    });

    it('should parse --watch flag', () => {
      const args = ['analyze', 'src/index.ts', '--watch'];
      const result = parseArgs(args);

      expect(result.options.watch).toBe(true);
    });

    it('should parse --config option', () => {
      const args = ['analyze', '--config', 'custom.config.json'];
      const result = parseArgs(args);

      expect(result.options.config).toBe('custom.config.json');
    });

    it('should parse --verbose flag', () => {
      const args = ['analyze', 'src/index.ts', '--verbose'];
      const result = parseArgs(args);

      expect(result.options.verbose).toBe(true);
    });

    it('should parse short options', () => {
      const args = ['analyze', 'src/index.ts', '-f', 'json', '-o', 'out.json'];
      const result = parseArgs(args);

      expect(result.options.format).toBe('json');
      expect(result.options.output).toBe('out.json');
    });
  });

  describe('validateOptions', () => {
    it('should accept valid format options', () => {
      expect(() => validateOptions({ format: 'json' })).not.toThrow();
      expect(() => validateOptions({ format: 'text' })).not.toThrow();
      expect(() => validateOptions({ format: 'markdown' })).not.toThrow();
    });

    it('should reject invalid format option', () => {
      expect(() => validateOptions({ format: 'invalid' })).toThrow(/Invalid format/);
    });

    it('should accept valid min-confidence values', () => {
      expect(() => validateOptions({ minConfidence: 0 })).not.toThrow();
      expect(() => validateOptions({ minConfidence: 0.5 })).not.toThrow();
      expect(() => validateOptions({ minConfidence: 1 })).not.toThrow();
    });

    it('should reject min-confidence below 0', () => {
      expect(() => validateOptions({ minConfidence: -0.1 })).toThrow(/between 0 and 1/);
    });

    it('should reject min-confidence above 1', () => {
      expect(() => validateOptions({ minConfidence: 1.5 })).toThrow(/between 0 and 1/);
    });

    it('should accept valid exclusion patterns', () => {
      expect(() =>
        validateOptions({
          exclude: ['node_modules', '**/*.test.ts'],
        })
      ).not.toThrow();
    });
  });

  describe('command routing', () => {
    it('should recognize analyze command', () => {
      const result = parseArgs(['analyze', 'src/index.ts']);
      expect(result.command).toBe('analyze');
    });

    it('should recognize init command', () => {
      const result = parseArgs(['init']);
      expect(result.command).toBe('init');
    });

    it('should recognize report command', () => {
      const result = parseArgs(['report', '--format', 'json']);
      expect(result.command).toBe('report');
    });

    it('should recognize watch command', () => {
      const result = parseArgs(['watch', 'src']);
      expect(result.command).toBe('watch');
    });

    it('should show help with --help flag', () => {
      const result = parseArgs(['--help']);
      expect(result.command).toBe('help');
    });

    it('should show version with --version flag', () => {
      const result = parseArgs(['--version']);
      expect(result.command).toBe('version');
    });
  });
});
