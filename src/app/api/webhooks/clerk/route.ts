import { NextRequest } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createUser, updateUser, getUserByClerkId } from "@/lib/users";

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.log("CLERK_WEBHOOK_SECRET not set, skipping webhook verification");
    return new Response("Webhook secret not configured", { status: 400 });
  }

  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    try {
      await createUser({
        clerkId: id,
        email: email_addresses[0]?.email_address || "",
        name: `${first_name || ""} ${last_name || ""}`.trim() || "User",
        profilePicture: image_url,
        smsOptIn: false,
        preferences: {
          notificationSettings: {
            groupDecisions: true,
            friendRequests: true,
            groupInvites: true,
          },
        },
      });

      console.log(`User created: ${id}`);
    } catch (error) {
      console.error("Error creating user:", error);
      return new Response("Error creating user", { status: 500 });
    }
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    try {
      const user = await getUserByClerkId(id);
      if (user) {
        await updateUser(user._id.toString(), {
          email: email_addresses[0]?.email_address || user.email,
          name: `${first_name || ""} ${last_name || ""}`.trim() || user.name,
          profilePicture: image_url || user.profilePicture,
        });

        console.log(`User updated: ${id}`);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      return new Response("Error updating user", { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    if (!id) {
      console.error("No user ID in deletion event");
      return new Response("No user ID provided", { status: 400 });
    }

    try {
      const user = await getUserByClerkId(id);
      if (user) {
        // Note: In a real app, you might want to soft delete or handle this differently
        // For now, we'll just log it
        console.log(`User deleted: ${id}`);
      }
    } catch (error) {
      console.error("Error handling user deletion:", error);
      return new Response("Error handling user deletion", { status: 500 });
    }
  }

  return new Response("", { status: 200 });
}
