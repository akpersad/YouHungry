import { NextRequest, NextResponse } from 'next/server';
import { urlShortener } from '@/lib/url-shortener';
import { connectToDatabase } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    // Ensure database is connected
    await connectToDatabase();

    const { shortCode } = await params;

    if (!shortCode) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    const originalUrl = await urlShortener.resolveShortUrl(shortCode);

    if (originalUrl) {
      logger.info(`Short URL resolved: ${shortCode} -> ${originalUrl}`);
      return NextResponse.redirect(originalUrl);
    } else {
      logger.warn(`Short URL not found: ${shortCode}`);
      return NextResponse.redirect(new URL('/', req.url));
    }
  } catch (error) {
    logger.error('Short URL resolution error:', error);
    return NextResponse.redirect(new URL('/', req.url));
  }
}
