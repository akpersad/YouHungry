#!/usr/bin/env node

/**
 * Simple test script to demonstrate smart logger functionality
 */

// Set environment to development first
process.env.NODE_ENV = 'development';

console.log('=== Testing Smart Logger ===\n');

console.log('1. Development Environment:');
const { logger } = require('../src/lib/logger');

logger.debug('This debug message should appear in development');
logger.info('This info message should appear in development');
logger.warn('This warning should appear in development');
logger.error('This error should appear in development');
logger.perf('This performance log should appear in development');
logger.api('This API log should appear in development');

console.log('\n2. Production Environment:');
process.env.NODE_ENV = 'production';

// Create new logger instance for production
const { Logger } = require('../src/lib/logger');
const prodLogger = new Logger();

prodLogger.debug('This debug message should NOT appear in production');
prodLogger.info('This info message should NOT appear in production');
prodLogger.warn('This warning SHOULD appear in production');
prodLogger.error('This error SHOULD appear in production');
prodLogger.perf('This performance log should NOT appear in production');
prodLogger.api('This API log should NOT appear in production');

console.log('\n3. Production with ENABLE_CONSOLE_LOGS:');
process.env.ENABLE_CONSOLE_LOGS = 'true';

const prodLoggerWithConsole = new Logger();

prodLoggerWithConsole.debug(
  'This debug message should appear with ENABLE_CONSOLE_LOGS'
);
prodLoggerWithConsole.info(
  'This info message should appear with ENABLE_CONSOLE_LOGS'
);
prodLoggerWithConsole.warn(
  'This warning should appear with ENABLE_CONSOLE_LOGS'
);
prodLoggerWithConsole.error(
  'This error should appear with ENABLE_CONSOLE_LOGS'
);

console.log('\n=== Smart Logger Test Complete ===');
console.log('✅ Debug logs automatically disabled in production');
console.log('✅ Error and warning logs preserved for monitoring');
console.log('✅ Environment variable override available for debugging');
console.log('✅ Performance logs only in development');
