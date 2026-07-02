import { logger } from './logger';

/**
 * Hard suppression seam for external notification sends (Phase 1, v2
 * WORKPLAN): Twilio SMS + Verify, Resend email, and web push may reach the
 * real provider ONLY in the production Vercel deployment. Everywhere else —
 * local dev/`next start`, preview deploys, CI, Jest, Playwright, seed
 * scripts — the send is a warn-logged no-op at the provider call site.
 *
 * v1 previously only REDIRECTED dev SMS to a test number, which still
 * billed Twilio and hit a real phone; this seam replaces that hope-based
 * setup with a default-closed gate. Escape hatch for deliberate operator
 * testing: ALLOW_REAL_NOTIFICATIONS=true.
 */
export function isExternalSendAllowed(): boolean {
  if (process.env.ALLOW_REAL_NOTIFICATIONS === 'true') return true;
  return process.env.VERCEL_ENV === 'production';
}

/** Log one warn-level line so suppressed sends are visible, never silent. */
export function warnSuppressed(
  channel: 'sms' | 'sms-verify' | 'email' | 'push',
  detail?: Record<string, unknown>
): void {
  logger.warn(
    `External ${channel} send suppressed (non-production environment; set ALLOW_REAL_NOTIFICATIONS=true to override)`,
    detail
  );
}
