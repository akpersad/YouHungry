import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk', // svix-signature verified in the handler
  // Called by the sign-up form before any session exists; protected by
  // per-IP rate limiting + strict input validation in the handler.
  '/api/auth/check-username',
  '/api/pwa-status',
  '/api/cron(.*)', // Vercel cron jobs — each handler must verify CRON_SECRET
  // v2 (greenfield tree, Phase 1+): cold-open value with no account. Routes
  // that need auth call requireAuth-style guards in their handlers/pages.
  '/beta(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    // Protect the route and redirect to our custom sign-in page.
    // `auth.protect()` is async and rejects with a NEXT_REDIRECT when the
    // request is unauthenticated — it MUST be awaited so Next consumes the
    // redirect. Calling it un-awaited in a sync callback leaves the rejected
    // promise floating, which Node reports as `unhandledRejection` on every
    // protected request while signed out (the NEXT_REDIRECT log flood).
    // unauthenticatedUrl must be ABSOLUTE — with a relative path,
    // NextResponse.redirect throws ERR_INVALID_URL and every signed-out
    // visit to a protected route 500s instead of redirecting.
    await auth.protect({
      unauthenticatedUrl: new URL('/sign-in', req.url).toString(),
    });
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
