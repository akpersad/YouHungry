# Production Simulation Guide

This guide explains how to run your Next.js application in production mode locally using production environment variables.

## 📋 Overview

The production simulation script allows you to:

- Test production configurations locally before deploying
- Verify production environment variables are correct
- Debug production-specific issues
- Test performance optimizations in production mode

## 🚀 Quick Start

### 1. Set Up Production Environment Variables

First, create your `.env.prod` file with production values:

```bash
cp env.prod.example .env.prod
```

Then fill in your actual production values in `.env.prod`.

### 2. Run Production Simulation

```bash
# Build and start production server
npm run prod

# Or run steps separately:
npm run prod:build    # Build only
npm run prod:start    # Start only (assumes already built)
```

## 📁 Environment File Structure

Your project should have these environment files:

- **`.env.local`** - Development environment variables (used by `npm run dev`)
- **`.env.prod`** - Production environment variables (used by `npm run prod`)
- **`env.example`** - Template for development setup (committed to git)
- **`env.prod.example`** - Template for production setup (committed to git)

## 🔧 Commands

| Command              | Description                                         |
| -------------------- | --------------------------------------------------- |
| `npm run prod`       | Build and start the app in production mode          |
| `npm run prod:build` | Only build the production bundle                    |
| `npm run prod:start` | Only start the production server (must build first) |

## 📊 What the Script Does

1. **Loads Production Environment**
   - Reads variables from `.env.prod`
   - Sets `NODE_ENV=production`
   - Validates required variables

2. **Shows Configuration**
   - Lists all loaded environment variables
   - Masks sensitive values (secrets, tokens, keys)
   - Warns about missing files or variables

3. **Builds Production Bundle**
   - Runs `next build` with production environment
   - Optimizes and minifies code
   - Generates production-ready assets

4. **Starts Production Server**
   - Runs `next start` with production environment
   - Serves optimized production build
   - Uses production URL from `NEXT_PUBLIC_APP_URL`

## ✅ Required Environment Variables

The script validates these critical variables:

```bash
MONGODB_URI
MONGODB_DATABASE
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
GOOGLE_PLACES_API_KEY
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
```

Missing any of these will cause the script to exit with an error.

## 🎨 Sample Output

```
============================================================
  🚀 Production Simulation Mode
============================================================

📋 Configuration:
   Environment File: .env.prod
   NODE_ENV: production
   Command: all

🔍 Validating environment variables...
✅ All required variables present

📦 Loaded environment variables:
   CLERK_SECRET_KEY=********************
   GOOGLE_PLACES_API_KEY=********************
   MONGODB_DATABASE=you-hungry
   MONGODB_URI=********************
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ...

============================================================
  🔨 Building Production Bundle
============================================================

▶️  Running: npm run build
...

✅ Build completed successfully!

============================================================
  🚀 Starting Production Server
============================================================

▶️  Running: npm run start
...
```

## 🛠️ Troubleshooting

### Missing .env.prod File

If you see:

```
⚠️  Warning: .env.prod not found!
   Using system environment variables instead.
```

**Solution:** Create the file:

```bash
cp env.prod.example .env.prod
```

### Missing Required Variables

If you see:

```
❌ Missing required environment variables:
   - MONGODB_URI
   - CLERK_SECRET_KEY
```

**Solution:** Add the missing variables to your `.env.prod` file.

### Port Already in Use

If port 3000 is already in use:

```bash
# Kill the process on port 3000
npm run dev:kill

# Or use a different port in NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Build Failures

If the build fails:

1. Check for TypeScript errors: `npm run type-check`
2. Check for linting errors: `npm run lint`
3. Ensure all dependencies are installed: `npm install`
4. Try building in development first: `npm run build`

## 🔒 Security Best Practices

1. **Never commit `.env.prod`** - It's already in `.gitignore`
2. **Use different values** for development and production
3. **Rotate secrets regularly** - API keys, tokens, passwords
4. **Use environment-specific keys** - e.g., `pk_test_...` vs `pk_live_...`
5. **Restrict API key permissions** - Only grant necessary permissions

## 🆚 Development vs Production

| Aspect       | Development (`.env.local`)   | Production (`.env.prod`)     |
| ------------ | ---------------------------- | ---------------------------- |
| `NODE_ENV`   | `development`                | `production`                 |
| Clerk Keys   | `pk_test_...`, `sk_test_...` | `pk_live_...`, `sk_live_...` |
| Database     | Test/development database    | Production database          |
| URL          | `http://localhost:3000`      | `https://yourdomain.com`     |
| Console Logs | Enabled by default           | Disabled by default          |
| Source Maps  | Included                     | Excluded                     |
| Minification | Minimal                      | Full                         |
| Hot Reload   | Enabled                      | Disabled                     |

## 📝 Notes

- The script will gracefully handle `Ctrl+C` to stop the server
- Sensitive values (containing SECRET, KEY, TOKEN, etc.) are masked in output
- The build process may take a few minutes depending on your app size
- Production mode is optimized for performance, not development speed
- Use this to test before deploying to Vercel/AWS/etc.

## 🤝 Integration with CI/CD

You can use this script in your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Test Production Build
  run: |
    cp env.prod.example .env.prod
    # Set actual values via secrets
    echo "MONGODB_URI=${{ secrets.MONGODB_URI }}" >> .env.prod
    echo "CLERK_SECRET_KEY=${{ secrets.CLERK_SECRET_KEY }}" >> .env.prod
    npm run prod:build
```

## 🔗 Related Documentation

- [Next.js Production Deployment](https://nextjs.org/docs/deployment)
- [Environment Variables in Next.js](https://nextjs.org/docs/basic-features/environment-variables)
- [Production Checklist](https://nextjs.org/docs/going-to-production)
