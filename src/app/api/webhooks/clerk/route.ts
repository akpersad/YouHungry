import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createUser, updateUser, getUserByClerkId } from '@/lib/users';

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.debug(
      'CLERK_WEBHOOK_SECRET not set, running in development mode without verification'
    );
    // In development, we'll process the webhook without verification
    // This allows testing user creation locally before production webhook setup
  }

  let evt: WebhookEvent;

  // Verify the payload with the headers (only if webhook secret is available)
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
      return new Response('Error occured', {
        status: 400,
      });
    }
  } else {
    // Development mode: parse the payload directly without verification
    logger.debug(
      'Development mode: parsing webhook payload without verification'
    );
    evt = JSON.parse(body) as WebhookEvent;
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const {
      id,
      email_addresses,
      first_name,
      last_name,
      image_url,
      phone_numbers,
      public_metadata,
      unsafe_metadata,
    } = evt.data;

    // Extract custom fields from metadata
    // Check unsafe_metadata first (client-side registration), then public_metadata (server-side)
    const metadata =
      (unsafe_metadata as Record<string, unknown> | undefined) ||
      (public_metadata as Record<string, unknown> | undefined);
    const city = typeof metadata?.city === 'string' ? metadata.city : undefined;
    const state =
      typeof metadata?.state === 'string' ? metadata.state : undefined;
    const smsOptIn =
      typeof metadata?.smsOptIn === 'boolean' ? metadata.smsOptIn : false;
    const phoneNumber =
      (typeof metadata?.phoneNumber === 'string'
        ? metadata.phoneNumber
        : undefined) || phone_numbers?.[0]?.phone_number;

    try {
      await createUser({
        clerkId: id,
        email: email_addresses[0]?.email_address || '',
        name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
        profilePicture: image_url,
        phoneNumber,
        phoneVerified: false,
        smsOptIn,
        city,
        state,
        preferences: {
          locationSettings: {
            city,
            state,
            country: 'US',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          notificationSettings: {
            groupDecisions: {
              started: true,
              completed: true,
            },
            friendRequests: true,
            groupInvites: true,
            smsEnabled: smsOptIn,
            emailEnabled: true,
            pushEnabled: true,
          },
        },
      });

      logger.debug(`User created via webhook: ${id}`, {
        city,
        state,
        smsOptIn,
        hasPhone: !!phoneNumber,
      });
    } catch (error) {
      logger.error('Error creating user:', error);
      return new Response('Error creating user', { status: 500 });
    }
  }

  if (eventType === 'user.updated') {
    const {
      id,
      email_addresses,
      first_name,
      last_name,
      image_url,
      phone_numbers,
      public_metadata,
      unsafe_metadata,
    } = evt.data;

    // Extract custom fields from metadata
    // Check unsafe_metadata first (client-side updates), then public_metadata (server-side)
    const metadata =
      (unsafe_metadata as Record<string, unknown> | undefined) ||
      (public_metadata as Record<string, unknown> | undefined);
    const city = typeof metadata?.city === 'string' ? metadata.city : undefined;
    const state =
      typeof metadata?.state === 'string' ? metadata.state : undefined;
    const smsOptIn =
      typeof metadata?.smsOptIn === 'boolean' ? metadata.smsOptIn : undefined;
    const phoneNumber =
      (typeof metadata?.phoneNumber === 'string'
        ? metadata.phoneNumber
        : undefined) || phone_numbers?.[0]?.phone_number;

    try {
      const user = await getUserByClerkId(id);
      if (user) {
        await updateUser(user._id.toString(), {
          email: email_addresses[0]?.email_address || user.email,
          name: `${first_name || ''} ${last_name || ''}`.trim() || user.name,
          profilePicture: image_url || user.profilePicture,
          phoneNumber: phoneNumber || user.phoneNumber,
          city: city || user.city,
          state: state || user.state,
          smsOptIn: smsOptIn !== undefined ? smsOptIn : user.smsOptIn,
        });

        logger.debug(`User updated via webhook: ${id}`);
      }
    } catch (error) {
      logger.error('Error updating user:', error);
      return new Response('Error updating user', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    if (!id) {
      logger.error('No user ID in deletion event');
      return new Response('No user ID provided', { status: 400 });
    }

    try {
      const user = await getUserByClerkId(id);
      if (user) {
        // Note: In a real app, you might want to soft delete or handle this differently
        // For now, we'll just log it
        logger.debug(`User deleted: ${id}`);
      }
    } catch (error) {
      logger.error('Error handling user deletion:', error);
      return new Response('Error handling user deletion', { status: 500 });
    }
  }

  return new Response('', { status: 200 });
}
