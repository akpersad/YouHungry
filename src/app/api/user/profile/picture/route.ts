import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { logger } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { updateUser } from '@/lib/users';

// POST /api/user/profile/picture - Upload profile picture
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `profile-pictures/${user._id.toString()}-${timestamp}.${fileExtension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    });

    // Track API usage for cost monitoring
    try {
      const { trackAPIUsage } = await import('@/lib/api-usage-tracker');
      await trackAPIUsage('vercel_blob_put', false, {
        filename,
        size: file.size,
        contentType: file.type,
      });
    } catch (error) {
      logger.error('Failed to track Blob API usage:', error);
    }

    // Update user profile with new picture URL
    const updatedUser = await updateUser(user._id.toString(), {
      profilePicture: blob.url,
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update profile picture' },
        { status: 500 }
      );
    }

    logger.info('Profile picture uploaded', {
      userId: user._id.toString(),
      blobUrl: blob.url,
    });

    return NextResponse.json({
      success: true,
      profilePicture: blob.url,
    });
  } catch (error) {
    logger.error('Error uploading profile picture:', error);
    return NextResponse.json(
      { error: 'Failed to upload profile picture' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/profile/picture - Remove profile picture
export async function DELETE() {
  try {
    const user = await requireAuth();

    // Update user profile to remove picture URL
    const updatedUser = await updateUser(user._id.toString(), {
      profilePicture: undefined,
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to remove profile picture' },
        { status: 500 }
      );
    }

    logger.info('Profile picture removed', {
      userId: user._id.toString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Profile picture removed successfully',
    });
  } catch (error) {
    logger.error('Error removing profile picture:', error);
    return NextResponse.json(
      { error: 'Failed to remove profile picture' },
      { status: 500 }
    );
  }
}
