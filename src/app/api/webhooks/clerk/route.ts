import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { getV2Db } from '@/lib/v2/db';

/**
 * Clerk user lifecycle sync (svix-signed). Re-fit at the Phase 7 cutover
 * to the lean v2 user shape: clerkId, email, name — nothing else. The
 * upsert mirrors getV2User's webhook-gap auto-create, so whichever side
 * fires first wins without duplicates.
 */

function profileOf(data: {
  id?: string;
  email_addresses?: { email_address: string }[];
  first_name?: string | null;
  last_name?: string | null;
}): { email: string | undefined; name: string | undefined } {
  const email = data.email_addresses?.[0]?.email_address;
  const name =
    [data.first_name, data.last_name].filter(Boolean).join(' ') ||
    email?.split('@')[0];
  return { email, name };
}

export async function POST(req: NextRequest) {
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Fail closed in production: never process unverified webhook payloads.
    if (process.env.NODE_ENV === 'production') {
      logger.error(
        'CLERK_WEBHOOK_SECRET not configured in production - rejecting webhook'
      );
      return new Response('Webhook secret not configured', { status: 500 });
    }
    logger.debug(
      'CLERK_WEBHOOK_SECRET not set, running in development mode without verification'
    );
  }

  let evt: WebhookEvent;
  if (webhookSecret) {
    const wh = new Webhook(webhookSecret);
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      logger.error('Error verifying webhook:', err);
      return new Response('Error occured', { status: 400 });
    }
  } else {
    evt = JSON.parse(body) as WebhookEvent;
  }

  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id } = evt.data;
    const { email, name } = profileOf(evt.data);
    if (!id || !email) {
      // Without an email there is nothing worth syncing; the session-side
      // auto-create picks the user up once Clerk has one.
      logger.warn('Clerk webhook event without id/email; skipping', {
        eventType,
      });
      return new Response('', { status: 200 });
    }
    try {
      const { users } = await getV2Db();
      const now = new Date();
      await users.updateOne(
        { clerkId: id },
        {
          $set: { email, name: name || email.split('@')[0], updatedAt: now },
          $setOnInsert: { clerkId: id, createdAt: now },
        },
        { upsert: true }
      );
      logger.debug(`User synced via webhook: ${id}`, { eventType });
    } catch (error) {
      logger.error('Error syncing user from webhook:', error);
      return new Response('Error syncing user', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    if (!id) {
      logger.error('No user ID in deletion event');
      return new Response('No user ID provided', { status: 400 });
    }
    // Deliberately a log, not a delete: fork history references the user
    // doc, and account deletion cleanup is an owner-level decision.
    logger.info(`Clerk user deleted: ${id}`);
  }

  return new Response('', { status: 200 });
}
