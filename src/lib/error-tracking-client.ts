/**
 * Client-Side Error Tracking
 *
 * Client-safe error tracking utilities that don't import server-only modules
 */

/**
 * Client-side error logger
 * Sends error to API endpoint for server-side processing
 */
export async function logClientError(
  error: Error | unknown,
  additionalData?: Record<string, unknown>,
  userReport?: string
): Promise<void> {
  try {
    await fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        url: window.location.href,
        userAgent: navigator.userAgent,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        additionalData,
        userReport: userReport ? { description: userReport } : undefined,
      }),
    });
  } catch (err) {
    console.error('Failed to log client error:', err);
  }
}
