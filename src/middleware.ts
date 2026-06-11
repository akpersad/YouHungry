import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk', // svix-signature verified in the handler
  '/api/pwa-status',
  '/api/cron(.*)', // Vercel cron jobs — each handler must verify CRON_SECRET
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
