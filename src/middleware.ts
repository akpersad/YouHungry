import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Since the Phase 7 cutover the whole page tree is public at the middleware
// layer: cold-open value needs no account, guest voting on /f/[code] is the
// core mechanic, and pages that DO need an account (new/places/crew) gate
// themselves server-side with a sign-in round-trip that preserves ?next=.
const isPublicRoute = createRouteMatcher([
  '/',
  '/new',
  // Fork rooms + short links: the public guest-voting surface. Guest writes
  // are guarded by signed fork tokens, the signed guest cookie, and rate
  // limits in the API handlers.
  '/f(.*)',
  '/places(.*)',
  '/crew(.*)',
  '/account', // gates itself: sign-in round-trip preserving ?next=
  '/unsubscribe', // email opt-out landing: the signed token IS the auth
  '/gallery', // the living design-system page
  '/offline', // the service worker's navigation fallback (precached)
  '/privacy',
  '/admin', // gates itself: sign-in round-trip + 404 for non-admins
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk', // svix-signature verified in the handler
  // v2 API: every handler guards itself via requireV2User (JSON 401, not an
  // HTML sign-in redirect — these are fetch/EventSource targets). quick-spin
  // is genuinely public; the rest 401 without a session.
  '/api/v2(.*)',
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
