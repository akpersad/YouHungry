import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/restaurants/search',
  '/api/webhooks/clerk',
  '/api/decisions(.*)',
  '/api/collections(.*)',
  '/api/restaurants(.*)',
  '/api/address(.*)',
  '/push-test',
  '/pwa-explorer',
  '/api/pwa-status',
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    // Protect the route and redirect to our custom sign-in page
    // with the original URL as a redirect_url parameter
    auth.protect({
      unauthenticatedUrl: '/sign-in',
    });
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
