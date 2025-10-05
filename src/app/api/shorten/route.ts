import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { urlShortener } from '@/lib/url-shortener';
import { connectToDatabase } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    // Ensure database is connected
    await connectToDatabase();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { url, expiresInDays } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const shortUrl = await urlShortener.shortenUrl(url, expiresInDays);

    logger.info(`URL shortened via API: ${url} -> ${shortUrl}`);

    return NextResponse.json({
      success: true,
      originalUrl: url,
      shortUrl,
    });
  } catch (error) {
    logger.error('URL shortening API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
