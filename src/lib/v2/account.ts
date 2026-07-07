import { ObjectId } from 'mongodb';
import { clerkClient, currentUser } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import { getV2Db } from './db';
import { V2DomainError } from './errors';
import { verifyUnsubscribeToken } from './tokens';
import type {
  UserNotificationSettings,
  UserPushSubscriptionDoc,
  V2UserDoc,
} from './schema';

/**
 * The account surface: the one place a signed-in user manages what the app
 * knows about them (name, email, password — Clerk owns identity, Mongo
 * mirrors the lean shape) and how it may reach them (the single
 * "We're going here." push/email, per notifications.ts).
 *
 * Identity writes go through Clerk FIRST and mirror into Mongo after, the
 * same direction the webhook flows — Mongo never holds a value Clerk
 * doesn't. Notification preferences and push subscriptions are app data;
 * they live only on the user doc, under v1's field names, because prod
 * docs migrated with that exact shape and the send path already reads it.
 */

/** Browsers register one subscription each; this bounds a pathological doc. */
export const MAX_PUSH_SUBSCRIPTIONS = 10;

export interface NotificationSettingsView {
  pushEnabled: boolean;
  emailEnabled: boolean;
}

export interface AccountView {
  firstName: string;
  name: string;
  email: string;
  /** Saved search anchor's display label, null when unset. */
  searchAnchorLabel: string | null;
  notifications: NotificationSettingsView;
  /** Registered push endpoints — lets a device recognize itself. */
  pushEndpoints: string[];
}

/** Absent flags mean ON — the reading notifications.ts has always used. */
export function toNotificationSettingsView(
  settings: UserNotificationSettings | undefined
): NotificationSettingsView {
  return {
    pushEnabled: settings?.pushEnabled !== false,
    emailEnabled: settings?.emailEnabled !== false,
  };
}

export function toAccountView(user: V2UserDoc): AccountView {
  return {
    firstName: user.name.split(' ')[0] || user.name,
    name: user.name,
    email: user.email,
    searchAnchorLabel: user.searchAnchor?.label ?? null,
    notifications: toNotificationSettingsView(
      user.preferences?.notificationSettings
    ),
    pushEndpoints: (user.pushSubscriptions ?? []).map((sub) => sub.endpoint),
  };
}

/** Clerk API errors carry human-written messages; surface the first one. */
function clerkMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'errors' in error &&
    Array.isArray((error as { errors: unknown }).errors)
  ) {
    const first = (
      error as { errors: Array<{ message?: string; longMessage?: string }> }
    ).errors[0];
    return first?.longMessage ?? first?.message ?? fallback;
  }
  return fallback;
}

/** The webhook's name derivation, kept identical so the mirrors agree. */
function nameFrom(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string
): string {
  return [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0];
}

/**
 * Mirror Clerk's current email + name onto the user doc and return the
 * fresh doc. The webhook does this too, but not in dev (no tunnel) and not
 * synchronously — after an email change the account page must not show the
 * old address for a webhook-delivery beat.
 */
export async function syncAccountFromClerk(
  user: V2UserDoc
): Promise<AccountView> {
  const profile = await currentUser();
  const email =
    profile?.primaryEmailAddress?.emailAddress ??
    profile?.emailAddresses?.[0]?.emailAddress ??
    user.email;
  const name = nameFrom(profile?.firstName, profile?.lastName, email);

  const { users } = await getV2Db();
  const updated = await users.findOneAndUpdate(
    { _id: user._id },
    { $set: { email, name, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  return toAccountView(updated ?? { ...user, email, name });
}

/**
 * First name is the only name the product ever shows (fork pages, crews,
 * the header all render first names), so it is the only name the account
 * edits. Clerk keeps whatever last name it already holds.
 */
export async function setFirstName(
  user: V2UserDoc,
  firstName: string
): Promise<AccountView> {
  const client = await clerkClient();
  let updated;
  try {
    updated = await client.users.updateUser(user.clerkId, { firstName });
  } catch (error) {
    throw new V2DomainError(
      clerkMessage(error, 'Could not update your name. Try again.')
    );
  }

  const name = nameFrom(updated.firstName, updated.lastName, user.email);
  const { users } = await getV2Db();
  const doc = await users.findOneAndUpdate(
    { _id: user._id },
    { $set: { name, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  return toAccountView(doc ?? { ...user, name });
}

/**
 * Password change, custom-flow style: prove the current password, then set
 * the new one. Other sessions are revoked (a password change is usually
 * "someone else might have this") but the session doing the changing
 * survives — Clerk's own signOutOfOtherSessions flag kills ALL sessions,
 * current included, so the revoke is done by hand.
 */
export async function changePassword(
  user: V2UserDoc,
  input: {
    currentPassword: string;
    newPassword: string;
    /** The caller's Clerk session id — the one session left signed in. */
    currentSessionId: string | null;
  }
): Promise<void> {
  const client = await clerkClient();

  try {
    await client.users.verifyPassword({
      userId: user.clerkId,
      password: input.currentPassword,
    });
  } catch {
    // Clerk rejects with a 4xx for a wrong password; anything else (outage)
    // also lands here, and retrying with the same message is honest enough.
    throw new V2DomainError('That current password is not right.');
  }

  try {
    await client.users.updateUser(user.clerkId, {
      password: input.newPassword,
    });
  } catch (error) {
    // Clerk's password rules (length, breach lists) speak for themselves.
    throw new V2DomainError(
      clerkMessage(error, 'Could not update your password. Try again.')
    );
  }

  // Best-effort: a failure to revoke must not report the change as failed.
  try {
    const sessions = await client.sessions.getSessionList({
      userId: user.clerkId,
      status: 'active',
    });
    await Promise.all(
      sessions.data
        .filter((session) => session.id !== input.currentSessionId)
        .map((session) => client.sessions.revokeSession(session.id))
    );
  } catch (error) {
    logger.warn('account: could not revoke other sessions', { error });
  }
}

/**
 * Save (or clear, with null) the address restaurant searches anchor to.
 * Geocoded once here — searches then use the stored point for free. The
 * raw typed string is discarded on success; only Google's normalized label
 * and the point are kept.
 */
export async function setSearchAnchor(
  user: V2UserDoc,
  address: string | null
): Promise<AccountView> {
  const { users } = await getV2Db();

  if (address === null) {
    const cleared = await users.findOneAndUpdate(
      { _id: user._id },
      { $unset: { searchAnchor: '' }, $set: { updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return toAccountView(cleared ?? { ...user, searchAnchor: undefined });
  }

  const { geocodeAddress, isGooglePlacesEnabled } =
    await import('./google-places');
  if (!isGooglePlacesEnabled()) {
    // Dev/CI honesty: the billing gate is closed, so lookups cannot work.
    throw new V2DomainError(
      'Address lookup is turned off in this environment.'
    );
  }
  const geocoded = await geocodeAddress(address);
  if (!geocoded) {
    throw new V2DomainError(
      'Could not find that address. Add a city and state and try again.'
    );
  }

  const anchor = {
    label: geocoded.label,
    location: {
      type: 'Point' as const,
      coordinates: [geocoded.lng, geocoded.lat] as [number, number],
    },
  };
  const updated = await users.findOneAndUpdate(
    { _id: user._id },
    { $set: { searchAnchor: anchor, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  return toAccountView(updated ?? { ...user, searchAnchor: anchor });
}

export async function setNotificationSettings(
  userId: ObjectId,
  settings: UserNotificationSettings
): Promise<NotificationSettingsView> {
  const set: Record<string, boolean | Date> = { updatedAt: new Date() };
  if (settings.pushEnabled !== undefined) {
    set['preferences.notificationSettings.pushEnabled'] = settings.pushEnabled;
  }
  if (settings.emailEnabled !== undefined) {
    set['preferences.notificationSettings.emailEnabled'] =
      settings.emailEnabled;
  }

  const { users } = await getV2Db();
  const doc = await users.findOneAndUpdate(
    { _id: userId },
    { $set: set },
    { returnDocument: 'after' }
  );
  return toNotificationSettingsView(doc?.preferences?.notificationSettings);
}

/**
 * Register this browser's push subscription. Idempotent per endpoint (a
 * re-subscribe replaces the stored keys) and bounded: the newest
 * MAX_PUSH_SUBSCRIPTIONS win, matching how real devices come and go.
 */
export async function addPushSubscription(
  userId: ObjectId,
  subscription: UserPushSubscriptionDoc
): Promise<void> {
  const { users } = await getV2Db();
  await users.updateOne(
    { _id: userId },
    { $pull: { pushSubscriptions: { endpoint: subscription.endpoint } } }
  );
  await users.updateOne(
    { _id: userId },
    {
      $push: {
        pushSubscriptions: {
          $each: [subscription],
          $slice: -MAX_PUSH_SUBSCRIPTIONS,
        },
      },
      $set: { updatedAt: new Date() },
    }
  );
}

export async function removePushSubscription(
  userId: ObjectId,
  endpoint: string
): Promise<void> {
  const { users } = await getV2Db();
  await users.updateOne(
    { _id: userId },
    {
      $pull: { pushSubscriptions: { endpoint } },
      $set: { updatedAt: new Date() },
    }
  );
}

/**
 * The email link's one-tap opt-out: the signed token IS the authorization,
 * no session involved. Returns false for a bad/expired token (the page
 * says so honestly) — flipping the flag twice is harmlessly idempotent.
 */
export async function unsubscribeEmailByToken(token: string): Promise<boolean> {
  const userIdHex = verifyUnsubscribeToken(token);
  if (!userIdHex) return false;

  const { users } = await getV2Db();
  const result = await users.updateOne(
    { _id: new ObjectId(userIdHex) },
    {
      $set: {
        'preferences.notificationSettings.emailEnabled': false,
        updatedAt: new Date(),
      },
    }
  );
  return result.matchedCount > 0;
}
