# URL Shortener Service

A comprehensive URL shortening service integrated with the You Hungry notification system to make SMS messages more concise and user-friendly.

## 🚀 Features

- **Dual Strategy**: Uses TinyURL (free) first, falls back to custom shortener
- **Custom Shortener**: Database-backed with 6-character codes and expiration
- **SMS Integration**: Automatically shortens URLs in SMS notifications
- **Click Tracking**: Monitors engagement with shortened links
- **Expiration**: URLs can expire after specified days (default: 30 days)
- **Cleanup**: Automatic cleanup of expired URLs

## 📁 Files

### Core Service

- `src/lib/url-shortener.ts` - Main URL shortening service

### API Endpoints

- `src/app/api/shorten/route.ts` - URL shortening API
- `src/app/s/[shortCode]/route.ts` - Short URL resolution

### React Hook

- `src/hooks/useURLShortener.ts` - Client-side URL shortening hook

### Database

- `src/types/database.ts` - ShortUrl interface added

## 🔧 Configuration

### Environment Variables

```bash
# Required for custom shortener
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Collection

The service automatically creates a `short_urls` collection in MongoDB with the following schema:

```typescript
interface ShortUrl {
  _id: ObjectId;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  expiresAt?: Date;
  clickCount: number;
}
```

## 🎯 Usage

### Server-Side (Service)

```typescript
import { urlShortener } from '@/lib/url-shortener';

// Shorten a URL
const shortUrl = await urlShortener.shortenUrl(
  'https://example.com/very/long/url'
);

// Shorten with expiration (30 days)
const shortUrl = await urlShortener.shortenUrl(
  'https://example.com/very/long/url',
  30
);

// Resolve short URL
const originalUrl = await urlShortener.resolveShortUrl('abc123');

// Get statistics
const stats = await urlShortener.getShortUrlStats('abc123');

// Cleanup expired URLs
const deletedCount = await urlShortener.cleanupExpiredUrls();
```

### Client-Side (Hook)

```typescript
import { useURLShortener } from '@/hooks/useURLShortener';

function MyComponent() {
  const { loading, error, shortenUrl } = useURLShortener();

  const handleShorten = async () => {
    const result = await shortenUrl({
      url: 'https://example.com/very/long/url',
      expiresInDays: 30
    });

    if (result.success) {
      console.log('Shortened URL:', result.shortUrl);
    }
  };

  return (
    <button onClick={handleShorten} disabled={loading}>
      {loading ? 'Shortening...' : 'Shorten URL'}
    </button>
  );
}
```

### API Endpoints

#### Shorten URL

```bash
POST /api/shorten
Content-Type: application/json
Authorization: Required

{
  "url": "https://example.com/very/long/url",
  "expiresInDays": 30
}
```

#### Resolve Short URL

```bash
GET /s/abc123
# Redirects to original URL
```

## 🔗 SMS Integration

The URL shortener is automatically integrated with SMS notifications:

### Before (Long URLs)

```
🍽️ You Hungry? - Pizza Night has started a group decision! Vote for your top 3 restaurants by 12/15/2024 at 6:00:00 PM. Visit http://localhost:3000/groups/507f1f77bcf86cd799439011 to participate.
```

### After (Short URLs)

```
🍽️ You Hungry? - Pizza Night has started a group decision! Vote by 12/15/2024 at 6:00:00 PM. https://tinyurl.com/abc123
```

## 📊 Benefits

- **SMS Character Savings**: ~50-70 characters saved per message
- **Better UX**: Cleaner, shorter messages
- **Click Tracking**: Monitor engagement with group links
- **Cost Effective**: Uses free TinyURL service primarily
- **Fallback**: Custom shortener ensures reliability

## 🧪 Testing

1. Navigate to `/notification-test`
2. Scroll to "URL Shortener Tests" section
3. Enter a long URL
4. Click "Shorten URL" and verify result
5. Test clicking the shortened URL
6. Verify SMS notifications include shortened URLs

## 🔄 How It Works

1. **TinyURL First**: Attempts to shorten using TinyURL API
2. **Custom Fallback**: If TinyURL fails, uses custom shortener
3. **Database Storage**: Stores mapping in MongoDB
4. **Resolution**: `/s/[shortCode]` endpoint resolves to original URL
5. **Tracking**: Increments click count on each resolution
6. **Cleanup**: Expired URLs are automatically cleaned up

## 🛠️ Maintenance

### Cleanup Expired URLs

```typescript
// Run periodically (e.g., daily cron job)
const deletedCount = await urlShortener.cleanupExpiredUrls();
console.log(`Cleaned up ${deletedCount} expired URLs`);
```

### Monitor Usage

```typescript
// Get statistics for a short URL
const stats = await urlShortener.getShortUrlStats('abc123');
console.log(`Click count: ${stats.clickCount}`);
console.log(`Created: ${stats.createdAt}`);
console.log(`Expires: ${stats.expiresAt}`);
```
