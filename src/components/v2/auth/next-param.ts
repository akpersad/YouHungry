/**
 * Sanitize the ?next= return path on the auth screens. Only same-app /beta
 * paths are honored — anything else (external URLs, protocol-relative
 * tricks, v1 routes) falls back to the lane home.
 */
export function safeNextPath(next: string | null): string {
  if (next && next.startsWith('/beta') && !next.startsWith('//')) {
    return next;
  }
  return '/beta';
}
