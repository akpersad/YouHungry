import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { updateUser } from '@/lib/users';
import { z } from 'zod';

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username too long')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    )
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
  city: z
    .string()
    .max(100, 'City name too long')
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
  state: z
    .string()
    .max(100, 'State name too long')
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
  smsOptIn: z.boolean().optional(),
  phoneNumber: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .refine(
      (val) => !val || /^\+?[1-9]\d{1,14}$/.test(val),
      'Invalid phone number format'
    )
    .optional(),
  smsPhoneNumber: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .refine(
      (val) => !val || /^\+?[1-9]\d{1,14}$/.test(val),
      'Invalid phone number format'
    )
    .optional(),
  preferences: z
    .object({
      defaultLocation: z
        .string()
        .max(200, 'Default location too long')
        .transform((val) => (val === '' ? undefined : val))
        .optional(),
      locationSettings: z
        .object({
          city: z
            .string()
            .max(100, 'City name too long')
            .transform((val) => (val === '' ? undefined : val))
            .optional(),
          state: z
            .string()
            .max(100, 'State name too long')
            .transform((val) => (val === '' ? undefined : val))
            .optional(),
          country: z
            .string()
            .max(100, 'Country name too long')
            .transform((val) => (val === '' ? undefined : val))
            .optional(),
          timezone: z
            .string()
            .max(50, 'Timezone too long')
            .transform((val) => (val === '' ? undefined : val))
            .optional(),
        })
        .optional(),
      notificationSettings: z
        .object({
          groupDecisions: z.boolean().optional(),
          friendRequests: z.boolean().optional(),
          groupInvites: z.boolean().optional(),
          smsEnabled: z.boolean().optional(),
          emailEnabled: z.boolean().optional(),
          pushEnabled: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
});

// GET /api/user/profile - Get current user profile
export async function GET() {
  try {
    const user = await requireAuth();

    // Return full user profile data
    return NextResponse.json({
      _id: user._id.toString(),
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      username: user.username,
      city: user.city,
      state: user.state,
      profilePicture: user.profilePicture,
      smsOptIn: user.smsOptIn,
      smsPhoneNumber: user.smsPhoneNumber,
      phoneNumber: user.phoneNumber,
      preferences: user.preferences,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Log the request body for debugging
    logger.info('Profile update request:', {
      userId: user._id.toString(),
      body: body,
      defaultLocation: body.preferences?.defaultLocation,
    });

    // Validate the request body
    const validation = profileUpdateSchema.safeParse(body);
    if (!validation.success) {
      logger.error('Profile validation failed:', {
        errors: validation.error.issues,
        body: body,
      });
      return NextResponse.json(
        {
          error: 'Invalid profile data',
          details: validation.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Check if username is being updated and if it's unique
    if (updates.username && updates.username !== user.username) {
      // TODO: Add username uniqueness check
      // For now, we'll allow the update
    }

    // Prepare update object
    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.username !== undefined) updateData.username = updates.username;
    if (updates.city !== undefined) updateData.city = updates.city;
    if (updates.state !== undefined) updateData.state = updates.state;
    if (updates.smsOptIn !== undefined) updateData.smsOptIn = updates.smsOptIn;
    if (updates.phoneNumber !== undefined)
      updateData.phoneNumber = updates.phoneNumber;
    if (updates.smsPhoneNumber !== undefined)
      updateData.smsPhoneNumber = updates.smsPhoneNumber;

    if (updates.preferences) {
      updateData.preferences = {
        ...user.preferences,
        ...updates.preferences,
        locationSettings: {
          ...user.preferences.locationSettings,
          ...updates.preferences.locationSettings,
        },
        notificationSettings: {
          ...user.preferences.notificationSettings,
          ...updates.preferences.notificationSettings,
        },
      };
    }

    // Update the user
    const updatedUser = await updateUser(user._id.toString(), updateData);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    logger.info('User profile updated', {
      userId: user._id.toString(),
      updates: Object.keys(updateData),
    });

    return NextResponse.json({
      success: true,
      user: {
        _id: updatedUser._id.toString(),
        clerkId: updatedUser.clerkId,
        email: updatedUser.email,
        name: updatedUser.name,
        username: updatedUser.username,
        city: updatedUser.city,
        state: updatedUser.state,
        profilePicture: updatedUser.profilePicture,
        smsOptIn: updatedUser.smsOptIn,
        smsPhoneNumber: updatedUser.smsPhoneNumber,
        phoneNumber: updatedUser.phoneNumber,
        preferences: updatedUser.preferences,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
