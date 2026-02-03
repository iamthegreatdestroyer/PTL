import { describe, it, expect, vi } from 'vitest';
import { Logger, createLogger, LogLevel } from '../../logger';

describe('Logger', () => {
  describe('createLogger', () => {
    it('should create logger with default level', () => {
      const logger = createLogger();
      expect(logger).toBeDefined();
    });

    it('should create logger with custom level', () => {
      const logger = createLogger({ level: LogLevel.DEBUG });
      expect(logger).toBeDefined();
    });

    it('should create logger with custom prefix', () => {
      const logger = createLogger({ prefix: '[PTL]' });
      expect(logger).toBeDefined();
    });
  });

  describe('Logger methods', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    let logger: Logger;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger = createLogger({ level: LogLevel.DEBUG });
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log debug messages when level is DEBUG', () => {
      logger.debug('debug message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      logger.info('info message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('warning message');
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should log error messages', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('error message');
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('Log levels', () => {
    it('should respect log level hierarchy', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = createLogger({ level: LogLevel.WARN });

      logger.debug('should not appear');
      logger.info('should not appear');

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log at or above the set level', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const logger = createLogger({ level: LogLevel.WARN });

      logger.warn('warning');
      logger.error('error');

      expect(warnSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('Structured logging', () => {
    it('should include metadata in logs', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = createLogger({ level: LogLevel.DEBUG });

      logger.info('message', { userId: '123', action: 'analyze' });

      const call = consoleSpy.mock.calls[0];
      expect(
        call.some((arg: string) => typeof arg === 'string' && arg.includes('userId')) ||
          call.some((arg: unknown) => typeof arg === 'object' && arg !== null && 'userId' in arg)
      ).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should handle error objects', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const logger = createLogger({ level: LogLevel.ERROR });

      const error = new Error('Test error');
      logger.error('Something failed', error);

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('Child loggers', () => {
    it('should create child logger with added prefix', () => {
      const logger = createLogger({ prefix: '[PTL]' });
      const childLogger = logger.child('[Core]');

      expect(childLogger).toBeDefined();
    });

    it('should inherit parent log level', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = createLogger({ level: LogLevel.WARN, prefix: '[PTL]' });
      const childLogger = logger.child('[Core]');

      childLogger.debug('should not appear');
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
