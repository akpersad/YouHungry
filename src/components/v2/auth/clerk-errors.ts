/**
 * Clerk error plumbing for the v2 auth forms. Clerk API errors carry an
 * `errors` array; we surface the first long message (they're written for
 * humans) and expose enough structure to detect specific params.
 */

interface ClerkApiError {
  code?: string;
  message?: string;
  longMessage?: string;
  meta?: { paramName?: string };
}

export function clerkErrors(err: unknown): ClerkApiError[] {
  if (
    typeof err === 'object' &&
    err !== null &&
    'errors' in err &&
    Array.isArray((err as { errors: unknown }).errors)
  ) {
    return (err as { errors: ClerkApiError[] }).errors;
  }
  return [];
}

export function clerkErrorMessage(err: unknown, fallback: string): string {
  const first = clerkErrors(err)[0];
  return first?.longMessage ?? first?.message ?? fallback;
}

/** True when the instance rejected the call for a missing/invalid param. */
export function clerkErrorMentionsParam(err: unknown, param: string): boolean {
  return clerkErrors(err).some((error) => error.meta?.paramName === param);
}

/**
 * v2 accounts are email + password only (owner decision 2026-07-02). Some
 * Clerk instances (the shared dev instance, configured in v1's era) still
 * require a username; when they do, derive one from the email rather than
 * asking — the user never sees it, and the form stays two fields.
 */
export function deriveUsername(email: string): string {
  const base = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 20)
    .padEnd(4, '0');
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}_${suffix}`;
}
