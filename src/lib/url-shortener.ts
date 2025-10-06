import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { ObjectId, Collection } from 'mongodb';

export interface ShortUrlData {
  _id?: ObjectId;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  expiresAt?: Date;
  clickCount: number;
}

export class URLShortenerService {
  private static instance: URLShortenerService;
  private collection: Collection<ShortUrlData> | undefined;

  private constructor() {
    // Don't initialize collection here - do it lazily
  }

  private async getCollection() {
    if (!this.collection) {
      if (!db) {
        throw new Error(
          'Database not initialized. Call connectToDatabase() first.'
        );
      }
      this.collection = db.collection<ShortUrlData>('short_urls');
    }
    return this.collection;
  }

  public static getInstance(): URLShortenerService {
    if (!URLShortenerService.instance) {
      URLShortenerService.instance = new URLShortenerService();
    }
    return URLShortenerService.instance;
  }

  /**
   * Generate a random short code
   */
  private generateShortCode(length: number = 6): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Shorten a URL using external service first, fallback to custom shortener
   */
  public async shortenUrl(
    originalUrl: string,
    expiresInDays?: number
  ): Promise<string> {
    try {
      // First try TinyURL (free service)
      const tinyUrl = await this.shortenWithTinyURL(originalUrl);
      if (tinyUrl) {
        logger.info(`URL shortened with TinyURL: ${originalUrl} -> ${tinyUrl}`);
        return tinyUrl;
      }
    } catch (error) {
      logger.warn(
        'TinyURL shortening failed, falling back to custom shortener:',
        error
      );
    }

    // Fallback to custom shortener
    return this.shortenWithCustomService(originalUrl, expiresInDays);
  }

  /**
   * Shorten URL using TinyURL (free service)
   */
  private async shortenWithTinyURL(
    originalUrl: string
  ): Promise<string | null> {
    try {
      const response = await fetch('https://tinyurl.com/api-create.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `url=${encodeURIComponent(originalUrl)}`,
      });

      if (response.ok) {
        const shortUrl = await response.text();
        // TinyURL returns the short URL or "Error" if failed
        if (shortUrl && !shortUrl.includes('Error')) {
          return shortUrl;
        }
      }
      return null;
    } catch (error) {
      logger.error('TinyURL API error:', error);
      return null;
    }
  }

  /**
   * Shorten URL using custom service
   */
  private async shortenWithCustomService(
    originalUrl: string,
    expiresInDays?: number
  ): Promise<string> {
    const collection = await this.getCollection();

    // Generate unique short code
    let shortCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      shortCode = this.generateShortCode();
      attempts++;

      if (attempts > maxAttempts) {
        throw new Error('Failed to generate unique short code');
      }
    } while (await collection.findOne({ shortCode }));

    // Create short URL record
    const shortUrlData: Omit<ShortUrlData, '_id'> = {
      originalUrl,
      shortCode,
      createdAt: new Date(),
      clickCount: 0,
    };

    if (expiresInDays) {
      shortUrlData.expiresAt = new Date();
      shortUrlData.expiresAt.setDate(
        shortUrlData.expiresAt.getDate() + expiresInDays
      );
    }

    await collection.insertOne(shortUrlData);

    // Return short URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shortUrl = `${baseUrl}/s/${shortCode}`;

    logger.info(
      `URL shortened with custom service: ${originalUrl} -> ${shortUrl}`
    );
    return shortUrl;
  }

  /**
   * Resolve short URL to original URL
   */
  public async resolveShortUrl(shortCode: string): Promise<string | null> {
    try {
      const collection = await this.getCollection();

      const shortUrlData = await collection.findOneAndUpdate(
        {
          shortCode,
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } },
          ],
        },
        { $inc: { clickCount: 1 } },
        { returnDocument: 'after' }
      );

      if (shortUrlData) {
        logger.info(
          `Short URL resolved: ${shortCode} -> ${shortUrlData.originalUrl}`
        );
        return shortUrlData.originalUrl;
      }

      return null;
    } catch (error) {
      logger.error('Failed to resolve short URL:', error);
      return null;
    }
  }

  /**
   * Get short URL statistics
   */
  public async getShortUrlStats(
    shortCode: string
  ): Promise<ShortUrlData | null> {
    try {
      const collection = await this.getCollection();
      return await collection.findOne({ shortCode });
    } catch (error) {
      logger.error('Failed to get short URL stats:', error);
      return null;
    }
  }

  /**
   * Clean up expired short URLs
   */
  public async cleanupExpiredUrls(): Promise<number> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteMany({
        expiresAt: { $lt: new Date() },
      });

      logger.info(`Cleaned up ${result.deletedCount} expired short URLs`);
      return result.deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired URLs:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const urlShortener = URLShortenerService.getInstance();
