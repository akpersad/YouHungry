import { ObjectId } from 'mongodb';
import { logger } from '../logger';
import {
  isExternalSendAllowed,
  warnSuppressed,
} from '../notification-suppression';
import { getV2Db } from './db';
import { V2_COLLECTIONS, type ForkDoc } from './schema';

/**
 * Account-holder conveniences, per the charter: the group chat is the
 * notification channel — the fork page everyone already has open IS the
 * result posting. Push and email exist only so an account-holder who
 * closed the tab still hears "we're going here". Two channels, one
 * trigger (fork closed with a result), no notification center.
 *
 * Everything here is fire-and-forget from the close path: a notification
 * failure must never fail, slow, or double a close. Sends honor the
 * Phase 1 suppression seam (push inside push-service, email here), so
 * dev/CI/tests never reach a real provider.
 */

/** The raw user fields this module reads off the shared v1/v2 users doc. */
interface NotifiableUserDoc {
  _id: ObjectId;
  email?: string;
  name?: string;
  pushSubscriptions?: Array<{
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }>;
  preferences?: {
    notificationSettings?: {
      pushEnabled?: boolean;
      emailEnabled?: boolean;
    };
  };
}

function forkUrl(code: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://fork-in-the-road.vercel.app';
  return `${base.replace(/\/$/, '')}/f/${code}`;
}

function winnerNameOf(fork: ForkDoc): string {
  const winnerId = fork.result?.placeId.toString();
  return (
    fork.options.find((option) => option.placeId.toString() === winnerId)
      ?.name ?? 'Somewhere good'
  );
}

async function sendResultEmail(
  to: string,
  winnerName: string,
  code: string
): Promise<void> {
  if (!isExternalSendAllowed()) {
    warnSuppressed('email', { kind: 'v2-fork-result' });
    return;
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const url = forkUrl(code);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL ?? 'onboarding@resend.dev',
      to: [to],
      subject: `We're going here: ${winnerName}`,
      html: [
        '<div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">',
        '<p style="font-size: 14px; color: #58685d; margin: 0 0 8px;">Your fork closed</p>',
        `<h1 style="font-size: 24px; color: #132a1b; margin: 0 0 16px;">${winnerName}</h1>`,
        `<p style="margin: 0 0 24px;"><a href="${url}" style="color: #8d5e00;">See the tally</a></p>`,
        '<p style="font-size: 12px; color: #58685d;">Fork In The Road</p>',
        '</div>',
      ].join(''),
    }),
  });
  if (!response.ok) {
    logger.warn('v2 result email send failed', { status: response.status });
    return;
  }
  const { trackAPIUsage } = await import('../api-usage-tracker');
  await trackAPIUsage('resend_email_sent', false);
}

async function sendResultPush(
  user: NotifiableUserDoc,
  winnerName: string,
  code: string
): Promise<void> {
  const subscriptions = user.pushSubscriptions ?? [];
  if (subscriptions.length === 0) return;
  // push-service honors the suppression seam at the provider call site.
  const { pushService } = await import('../push-service');
  const payload = {
    title: "We're going here.",
    body: `${winnerName}. Tap for the tally.`,
    tag: `fork-${code}`,
    data: { url: forkUrl(code) },
  };
  for (const subscription of subscriptions) {
    const outcome = await pushService.sendNotification(subscription, payload);
    if (outcome === 'expired') {
      // v1 precedent: prune dead endpoints as they surface.
      const { db } = await getV2Db();
      await db
        .collection<NotifiableUserDoc>(V2_COLLECTIONS.users)
        .updateOne(
          { _id: user._id },
          { $pull: { pushSubscriptions: { endpoint: subscription.endpoint } } }
        );
    }
  }
}

/**
 * Tell the account-holders a fork decided. Called (fire-and-forget) by
 * the sealed close paths in forks.ts, so it runs at most once per fork.
 * Solo decisions (one account, no guests) stay quiet — the person is
 * looking at the result they just made. Guests are unreachable by design
 * (zero PII); the fork page is their channel. v1 preference flags are
 * honored when someone has explicitly turned a channel off.
 */
export async function notifyForkClosed(fork: ForkDoc): Promise<void> {
  try {
    if (!fork.result || fork.status !== 'closed') return;
    const groupSize =
      fork.participantUserIds.length + fork.participantGuestIds.length;
    if (fork.participantUserIds.length === 0 || groupSize < 2) return;

    const { db } = await getV2Db();
    const users = await db
      .collection<NotifiableUserDoc>(V2_COLLECTIONS.users)
      .find({ _id: { $in: fork.participantUserIds } })
      .project<NotifiableUserDoc>({
        email: 1,
        name: 1,
        pushSubscriptions: 1,
        'preferences.notificationSettings.pushEnabled': 1,
        'preferences.notificationSettings.emailEnabled': 1,
      })
      .toArray();

    const winnerName = winnerNameOf(fork);
    const results = await Promise.allSettled(
      users.flatMap((user) => {
        const settings = user.preferences?.notificationSettings;
        const sends: Promise<void>[] = [];
        if (settings?.pushEnabled !== false) {
          sends.push(sendResultPush(user, winnerName, fork.code));
        }
        if (settings?.emailEnabled !== false && user.email) {
          sends.push(sendResultEmail(user.email, winnerName, fork.code));
        }
        return sends;
      })
    );
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      logger.warn('v2 fork-result notifications partially failed', {
        code: fork.code,
        failed: failed.length,
        of: results.length,
      });
    }
  } catch (error) {
    // Never let a notification take a close down with it.
    logger.error('v2 notifyForkClosed failed', { code: fork.code, error });
  }
}
