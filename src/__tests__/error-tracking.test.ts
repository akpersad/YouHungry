/**
 * Error Tracking Tests
 *
 * Tests for error logging, grouping, and tracking functionality
 */

import {
  generateErrorFingerprint,
  classifyErrorSeverity,
  categorizeError,
  parseUserAgent,
} from '@/lib/error-tracking';

describe('Error Tracking Utilities', () => {
  describe('generateErrorFingerprint', () => {
    it('should generate consistent fingerprints for same errors', () => {
      const message = 'TypeError: Cannot read property of undefined';
      const stack = 'at Component.render (Component.tsx:10:5)';

      const fingerprint1 = generateErrorFingerprint(message, stack);
      const fingerprint2 = generateErrorFingerprint(message, stack);

      expect(fingerprint1).toBe(fingerprint2);
    });

    it('should generate different fingerprints for different errors', () => {
      const message1 = 'TypeError: Cannot read property of undefined';
      const message2 = 'ReferenceError: foo is not defined';
      const stack = 'at Component.render (Component.tsx:10:5)';

      const fingerprint1 = generateErrorFingerprint(message1, stack);
      const fingerprint2 = generateErrorFingerprint(message2, stack);

      expect(fingerprint1).not.toBe(fingerprint2);
    });

    it('should handle errors without stack traces', () => {
      const message = 'Something went wrong';

      const fingerprint = generateErrorFingerprint(message);

      expect(fingerprint).toBeDefined();
      expect(typeof fingerprint).toBe('string');
    });
  });

  describe('classifyErrorSeverity', () => {
    it('should classify database errors as critical', () => {
      const error = new Error('Database connection failed');
      const severity = classifyErrorSeverity(error);

      expect(severity).toBe('critical');
    });

    it('should classify auth errors as critical', () => {
      const error = new Error('Authentication failed');
      const severity = classifyErrorSeverity(error);

      expect(severity).toBe('critical');
    });

    it('should classify generic errors as error', () => {
      const error = new Error('Something failed');
      const severity = classifyErrorSeverity(error);

      expect(severity).toBe('error');
    });

    it('should classify warnings correctly', () => {
      const error = new Error('Warning: Deprecated API');
      const severity = classifyErrorSeverity(error);

      expect(severity).toBe('warning');
    });

    it('should default to info for unclear messages', () => {
      const error = new Error('Something happened');
      const severity = classifyErrorSeverity(error);

      expect(severity).toBe('info');
    });
  });

  describe('categorizeError', () => {
    it('should categorize network errors correctly', () => {
      const error = new Error('Network request failed');
      const category = categorizeError(error);

      expect(category).toBe('network');
    });

    it('should categorize fetch errors as network', () => {
      const error = new Error('Failed to fetch');
      const category = categorizeError(error);

      expect(category).toBe('network');
    });

    it('should categorize API endpoint errors as api', () => {
      const error = new Error('Something went wrong');
      const category = categorizeError(error, '/api/restaurants');

      expect(category).toBe('api');
    });

    it('should categorize as client in browser environment', () => {
      const error = new Error('Unknown error');
      const category = categorizeError(error);

      // In test environment (jsdom), window is defined, so it's client
      expect(category).toBe('client');
    });
  });

  describe('parseUserAgent', () => {
    it('should parse Chrome user agent correctly', () => {
      const userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      const result = parseUserAgent(userAgent);

      expect(result.browser).toBe('Chrome');
      expect(result.device).toBe('Desktop');
    });

    it('should parse Safari user agent correctly', () => {
      const userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15';
      const result = parseUserAgent(userAgent);

      expect(result.browser).toBe('Safari');
      expect(result.device).toBe('Desktop');
    });

    it('should detect mobile devices', () => {
      const userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1';
      const result = parseUserAgent(userAgent);

      expect(result.device).toBe('Mobile');
    });

    it('should handle undefined user agent', () => {
      const result = parseUserAgent(undefined);

      expect(result).toEqual({});
    });
  });
});
