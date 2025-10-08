/**
 * Tests for the smart logger utility
 */

import { Logger } from '@/lib/logger';

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Replace global console
Object.assign(console, mockConsole);

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Reset environment
    // @ts-expect-error - Deleting for test purposes
    delete process.env.NODE_ENV;
    delete process.env.ENABLE_CONSOLE_LOGS;

    // Create new logger instance
    logger = new Logger();
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      // @ts-expect-error - Setting for test purposes
      process.env.NODE_ENV = 'development';
      logger = new Logger();
      // @ts-expect-error - accessing private method for testing
      logger.updateConfig();
    });

    it('should log debug messages in development', () => {
      logger.debug('Debug message');
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Debug message')
      );
    });

    it('should log info messages in development', () => {
      logger.info('Info message');
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Info message')
      );
    });

    it('should log warn messages in development', () => {
      logger.warn('Warning message');
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Warning message')
      );
    });

    it('should log error messages in development', () => {
      logger.error('Error message');
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error message')
      );
    });

    it('should log performance messages in development', () => {
      logger.perf('Performance message');
      expect(mockConsole.log).toHaveBeenCalledWith(
        '[PERF] Performance message'
      );
    });

    it('should log API messages in development', () => {
      logger.api('API message');
      expect(mockConsole.log).toHaveBeenCalledWith('[API] API message');
    });

    it('should log component messages in development', () => {
      logger.component('Component message');
      expect(mockConsole.log).toHaveBeenCalledWith(
        '[COMPONENT] Component message'
      );
    });

    it('should log analytics messages in development', () => {
      logger.analytics('Analytics message');
      expect(mockConsole.log).toHaveBeenCalledWith(
        '[ANALYTICS] Analytics message'
      );
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      // @ts-expect-error - Setting for test purposes
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_CONSOLE_LOGS = 'true';
      logger = new Logger();
      // @ts-expect-error - accessing private method for testing
      logger.updateConfig();
    });

    it('should NOT log debug messages in production', () => {
      logger.debug('Debug message');
      expect(mockConsole.log).not.toHaveBeenCalled();
    });

    it('should NOT log info messages in production', () => {
      logger.info('Info message');
      expect(mockConsole.info).not.toHaveBeenCalled();
    });

    it('should log warn messages in production', () => {
      logger.warn('Warning message');
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Warning message')
      );
    });

    it('should log error messages in production', () => {
      logger.error('Error message');
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error message')
      );
    });

    it('should NOT log performance messages in production', () => {
      logger.perf('Performance message');
      expect(mockConsole.log).not.toHaveBeenCalled();
    });

    it('should NOT log API messages in production', () => {
      logger.api('API message');
      expect(mockConsole.log).not.toHaveBeenCalled();
    });

    it('should NOT log component messages in production', () => {
      logger.component('Component message');
      expect(mockConsole.log).not.toHaveBeenCalled();
    });

    it('should NOT log analytics messages in production', () => {
      logger.analytics('Analytics message');
      expect(mockConsole.log).not.toHaveBeenCalled();
    });
  });

  describe('Production with ENABLE_CONSOLE_LOGS', () => {
    beforeEach(() => {
      // @ts-expect-error - Setting for test purposes
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_CONSOLE_LOGS = 'true';
      logger = new Logger();
      // @ts-expect-error - accessing private method for testing
      logger.updateConfig();
    });

    it('should log warn messages when ENABLE_CONSOLE_LOGS is true', () => {
      // Clear previous calls
      mockConsole.warn.mockClear();

      logger.warn('Warning message');
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Warning message')
      );
    });
  });

  describe('Log Level Filtering', () => {
    it('should respect log levels in development', () => {
      // @ts-expect-error - Setting for test purposes
      process.env.NODE_ENV = 'development';
      logger = new Logger();
      // @ts-expect-error - accessing private method for testing
      logger.updateConfig();

      // All levels should work in development
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(mockConsole.log).toHaveBeenCalledTimes(1); // debug
      expect(mockConsole.info).toHaveBeenCalledTimes(1); // info
      expect(mockConsole.warn).toHaveBeenCalledTimes(1); // warn
      expect(mockConsole.error).toHaveBeenCalledTimes(1); // error
    });

    it('should respect log levels in production', () => {
      // @ts-expect-error - Setting for test purposes
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_CONSOLE_LOGS = 'true';
      logger = new Logger();
      // @ts-expect-error - accessing private method for testing
      logger.updateConfig();

      // Only warn and error should work in production
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(mockConsole.log).not.toHaveBeenCalled(); // debug
      expect(mockConsole.info).not.toHaveBeenCalled(); // info
      expect(mockConsole.warn).toHaveBeenCalledTimes(1); // warn
      expect(mockConsole.error).toHaveBeenCalledTimes(1); // error
    });
  });

  describe('Message Formatting', () => {
    beforeEach(() => {
      // @ts-expect-error - Setting for test purposes
      process.env.NODE_ENV = 'development';
      logger = new Logger();
      // @ts-expect-error - accessing private method for testing
      logger.updateConfig();
    });

    it('should include timestamp in log messages', () => {
      logger.debug('Test message');

      const logCall = mockConsole.log.mock.calls[0][0];
      expect(logCall).toMatch(
        /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/
      );
    });

    it('should include log level in messages', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(mockConsole.log.mock.calls[0][0]).toContain('[DEBUG]');
      expect(mockConsole.info.mock.calls[0][0]).toContain('[INFO]');
      expect(mockConsole.warn.mock.calls[0][0]).toContain('[WARN]');
      expect(mockConsole.error.mock.calls[0][0]).toContain('[ERROR]');
    });

    it('should handle additional arguments', () => {
      logger.debug('Message with data', { key: 'value' }, 123);

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Message with data'),
        { key: 'value' },
        123
      );
    });
  });
});
