/**
 * Sanitize the ?next= return path on the auth screens. Only same-app
 * absolute paths are honored — external URLs and protocol-relative
 * tricks (`//evil.example`) fall back to the fork lane home.
 */
export function safeNextPath(next: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    return next;
  }
  return '/';
}
