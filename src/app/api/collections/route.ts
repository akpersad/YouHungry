import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getCollectionsByUserId,
  getGroupCollectionsByUserId,
  getAllCollectionsByUserId,
  createCollection,
  createGroupCollection,
} from '@/lib/collections';
import {
  validateCollectionName,
  validateCollectionDescription,
} from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'personal', 'group', or 'all'

    // SECURITY: collections are always scoped to the authenticated user.
    // A `userId` query param may still be sent by older clients, but it is
    // ignored to prevent enumerating other users' collections.
    const targetUserId = user.clerkId;

    let collections;
    let count;

    if (type === 'personal') {
      logger.debug('Fetching personal collections for user:', targetUserId);
      collections = await getCollectionsByUserId(targetUserId);
      logger.debug('Found personal collections:', collections);
      count = collections.length;
    } else if (type === 'group') {
      collections = await getGroupCollectionsByUserId(user._id.toString());
      count = collections.length;
    } else {
      // Default to 'all' - return both personal and group collections
      logger.debug('Fetching all collections for user:', targetUserId);
      const allCollections = await getAllCollectionsByUserId(targetUserId);
      logger.debug('Found all collections:', allCollections);
      collections = {
        personal: allCollections.personal,
        group: allCollections.group,
      };
      count = allCollections.personal.length + allCollections.group.length;
    }

    return NextResponse.json({
      success: true,
      collections,
      count,
    });
  } catch (error) {
    logger.error('Get collections error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, description, type, groupId } = body;

    // Validate collection name
    const nameError = validateCollectionName(name || '');
    if (nameError) {
      return NextResponse.json(
        { success: false, error: nameError },
        { status: 400 }
      );
    }

    // Validate description if provided
    if (description) {
      const descriptionError = validateCollectionDescription(description);
      if (descriptionError) {
        return NextResponse.json(
          { success: false, error: descriptionError },
          { status: 400 }
        );
      }
    }

    let collection;

    if (type === 'group' && groupId) {
      // Create group collection
      collection = await createGroupCollection(
        groupId,
        name,
        description,
        user._id.toString()
      );
    } else {
      // Create personal collection
      collection = await createCollection({
        name: (name || '').trim(),
        description: description?.trim() || undefined,
        type: 'personal',
        ownerId: user._id,
        restaurantIds: [],
      });
    }

    return NextResponse.json(
      {
        success: true,
        collection,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Create collection error:', error);
    if (error instanceof Error) {
      if (error.message.includes('not a member')) {
        return NextResponse.json(
          { success: false, error: 'You are not a member of this group' },
          { status: 403 }
        );
      }
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
